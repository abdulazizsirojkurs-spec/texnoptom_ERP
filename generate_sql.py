def main():
    with open('../products.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    cats = set()
    prods = []
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('──'): continue
        parts = line.split('\t')
        
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
            
        cats.add(cat_name)
        prods.append((prod_name, cat_name))
        
    sql = "ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;\n"
    sql += "ALTER TABLE categories ADD CONSTRAINT categories_name_key UNIQUE (name);\n\n"
    
    if cats:
        sql += "INSERT INTO categories (name) VALUES\n"
        sql += ",\n".join(f"('{c}')" for c in cats)
        sql += "\nON CONFLICT (name) DO NOTHING;\n\n"
        
    for p_name, c_name in prods:
        # Escape single quotes
        p_name = p_name.replace("'", "''")
        c_name = c_name.replace("'", "''")
        sql += f"INSERT INTO products (name, category_id) SELECT '{p_name}', id FROM categories WHERE name = '{c_name}';\n"
        
    with open('insert.sql', 'w', encoding='utf-8') as f:
        f.write(sql)

if __name__ == "__main__":
    main()
