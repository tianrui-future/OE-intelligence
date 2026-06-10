from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
from datetime import datetime
import httpx

app = Flask(__name__)
CORS(app)

KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.moonshot.cn/v1")

@app.route('/')
def home():
    return jsonify({"status": "OE Intelligence Hub API", "version": "1.0.0"})

@app.route('/health')
def health():
    return jsonify({"status": "ok", "kimi_configured": bool(KIMI_API_KEY)})

@app.route('/api/search', methods=['POST'])
def search():
    data = request.get_json() or {}
    company = data.get('company', '').strip()
    business_line = data.get('business_line', '').strip() or None
    
    if not company:
        return jsonify({"error": "Company name is required"}), 400
    
    if not KIMI_API_KEY:
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

    payload = {
        "model": "moonshot-v1-8k",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query}
        ],
        "tools": [{"type": "builtin_function", "function": {"name": "$web_search"}}],
        "temperature": 0.3
    }
    
    try:
        resp = httpx.post(
            f"{KIMI_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
            timeout=120.0
        )
        resp.raise_for_status()
        data = resp.json()
        
        content = ""
        if "choices" in data and len(data["choices"]) > 0:
            choice = data["choices"][0]
            if "message" in choice and "content" in choice["message"]:
                content = choice["message"]["content"]
        
        # Try to extract JSON
        json_match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', content, re.DOTALL)
        if json_match:
            try:
                result = json.loads(json_match.group(1).strip())
                return jsonify(result)
            except:
                pass
        
        # Fallback
        return jsonify({
            "company": company,
            "raw_content": content,
            "timeline": [],
            "org_chart": {"name": company, "children": []},
            "executive_flow": []
        })
        
    except Exception as e:
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
