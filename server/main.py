from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
import logging
from datetime import datetime
import httpx

# 强制开启详细日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.moonshot.cn/v1")

logger.info(f"服务启动 - KIMI_BASE_URL: {KIMI_BASE_URL}")
logger.info(f"KIMI_API_KEY 是否配置: {bool(KIMI_API_KEY)}")

@app.route('/')
def home():
    return jsonify({"status": "OE Intelligence Hub API", "version": "1.1.0"})

@app.route('/health')
def health():
    return jsonify({"status": "ok", "kimi_configured": bool(KIMI_API_KEY)})

@app.route('/api/search', methods=['POST'])
def search():
    data = request.get_json() or {}
    company = data.get('company', '').strip()
    business_line = data.get('business_line', '').strip() or None
    
    logger.info(f"收到搜索请求: company={company}, business_line={business_line}")
    
    if not company:
        logger.warning("请求缺少公司名")
        return jsonify({"error": "Company name is required"}), 400
    
    if not KIMI_API_KEY:
        logger.error("KIMI_API_KEY 未配置")
        return jsonify({"error": "KIMI_API_KEY not configured"}), 500
    
    headers = {
        "Authorization": f"Bearer {KIMI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    system_prompt = """你是一家企业情报分析专家。基于网络搜索结果，提取公司组织架构调整信息。

返回严格格式化的 JSON：
{
    "company": "公司名",
    "timeline": [
        {"date": "YYYY-MM", "event": "事件", "source": "https://...", "credibility": "official/authoritative/unverified"}
    ],
    "org_chart": {"name": "CEO", "children": []},
    "executive_flow": []
}

可信度规则：
- official: 公司公告、财报
- authoritative: 36氪、虎嗅、晚点LatePost
- unverified: 脉脉、LinkedIn

如果近3个月没有公开报道，返回空数组并说明。"""

    user_query = f"""请搜索 {company} {business_line or ''} 的组织架构调整、高管变动信息。

搜索关键词：
- {company} {business_line or ''} 组织架构调整
- {company} 高管变动
- {company} {business_line or ''} 部门负责人

按JSON格式返回。"""

    # 关键修复：使用支持工具调用的模型
    payload = {
        "model": "moonshot-v1-32k",  # 修复：8k 已下线，改用 32k
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "tools": [{"type": "builtin_function", "function": {"name": "$web_search"}}],
        "temperature": 0.3
    }
    
    logger.info(f"准备调用 Kimi API，模型: {payload['model']}")
    
    try:
        resp = httpx.post(
            f"{KIMI_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120.0
        )
        
        logger.info(f"Kimi API 响应状态码: {resp.status_code}")
        resp.raise_for_status()
        data = resp.json()
        
        # 记录原始响应结构
        logger.info(f"Kimi API 响应结构: {list(data.keys())}")
        
        content = ""
        if "choices" in data and len(data["choices"]) > 0:
            choice = data["choices"][0]
            logger.info(f"choice 结构: {list(choice.keys())}")
            
            if "message" in choice and "content" in choice["message"]:
                content = choice["message"]["content"]
                logger.info(f"Kimi 返回内容长度: {len(content)}")
                logger.info(f"Kimi 返回前300字: {content[:300]}")
            elif "message" in choice:
                # 可能是工具调用结果
                logger.info(f"message 内容: {choice['message']}")
                if "tool_calls" in choice["message"]:
                    logger.info(f"检测到工具调用: {choice['message']['tool_calls']}")
        else:
            logger.warning(f"响应中没有 choices: {data}")
        
        # 尝试提取 JSON
        json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', content, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group(1).strip())
                logger.info("成功从代码块解析 JSON")
                return jsonify(result)
            except json.JSONDecodeError as e:
                logger.error(f"JSON 解析失败: {e}")
                logger.error(f"尝试解析的内容: {json_match.group(1).strip()[:200]}")
        
        # 尝试直接解析整个内容
        try:
            result = json.loads(content.strip())
            logger.info("成功直接解析 JSON")
            return jsonify(result)
        except json.JSONDecodeError:
            logger.warning("内容不是纯 JSON，使用 fallback")
        
        # Fallback
        logger.info("返回 fallback 响应")
        return jsonify({
            "company": company,
            "raw_content": content,
            "timeline": [],
            "org_chart": {"name": company, "children": []},
            "executive_flow": []
        })
        
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP 错误: {e.response.status_code} - {e.response.text[:500]}")
        return jsonify({"error": f"Kimi API HTTP error: {e.response.status_code}"}), 500
    except httpx.RequestError as e:
        logger.error(f"请求错误: {str(e)}")
        return jsonify({"error": f"Request failed: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"未预期错误: {type(e).__name__}: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/compare', methods=['POST'])
def compare():
    data = request.get_json() or {}
    company = data.get('company', '')
    date_a = data.get('date_a', '')
    date_b = data.get('date_b', '')
    
    if not company or not date_a or not date_b:
        return jsonify({"error": "company, date_a, date_b required"}), 400
    
    return jsonify({
        "company": company,
        "date_a": date_a,
        "date_b": date_b,
        "diff_nodes": []
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
