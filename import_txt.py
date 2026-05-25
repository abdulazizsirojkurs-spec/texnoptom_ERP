import json
import urllib.request
import urllib.parse
import uuid

SUPABASE_URL = "https://zrrsmfueajlvktqvhsge.supabase.co"
SUPABASE_KEY = "sb_publishable_cZ66lnvqlE4sUkWV5ZkYQw_ErYbGJez"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def req(url, method, data=None):
    if data:
        data = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error {method} {url}: {e}")
        return None

def main():
    try:
        with open('../products.txt', 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        category_map = {}
        count = 0
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('──'): continue
            
            parts = line.split('\t')
            cat_name = ""
            prod_name = ""
            
            if len(parts) >= 3:
                cat_name = parts[1].strip()
                prod_name = parts[2].strip()
            elif len(parts) == 2:
                cat_name = parts[0].strip()
                prod_name = parts[1].strip()
            else:
                continue
                
            if not cat_name or not prod_name: continue
            
            if cat_name == "Qo''shimcha aksessuarlar":
                cat_name = "Aksessuarlar"
                
            cat_id = category_map.get(cat_name)
            if not cat_id:
                # Get or Create Category
                url = f"{SUPABASE_URL}/rest/v1/categories?name=eq.{urllib.parse.quote(cat_name)}&select=*"
                cat_data = req(url, "GET")
                if cat_data and len(cat_data) > 0:
                    cat_id = cat_data[0]['id']
                else:
                    new_cat = req(f"{SUPABASE_URL}/rest/v1/categories", "POST", {"name": cat_name})
                    if new_cat and len(new_cat) > 0:
                        cat_id = new_cat[0]['id']
                if cat_id:
                    category_map[cat_name] = cat_id
                    
            if cat_id:
                # Insert Product
                prod = req(f"{SUPABASE_URL}/rest/v1/products", "POST", {"name": prod_name, "category_id": cat_id})
                if prod:
                    count += 1
                    
        print(f"SUCCESS: {count} products inserted.")
        
    except Exception as e:
        print(f"Main error: {e}")

if __name__ == "__main__":
    main()
