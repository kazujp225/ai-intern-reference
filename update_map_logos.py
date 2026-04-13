import re
import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Mapping of company to Simple Icons slug and brand color
brands = {
    "Google": {"slug": "google", "color": "#4285F4"},
    "Apple": {"slug": "apple", "color": "#000000"},
    "Salesforce": {"slug": "salesforce", "color": "#00A1E0"},
    "Tesla": {"slug": "tesla", "color": "#E82127"},
    "Amazon": {"slug": "amazon", "color": "#FF9900"},
    "NVIDIA": {"slug": "nvidia", "color": "#76B900"},
    "IBM": {"slug": "ibm", "color": "#0530AD"},
    "Oracle": {"slug": "oracle", "color": "#F80000"},
    "xAI": {"slug": "x", "color": "#000000"}, # Using X logo as proxy
    "Adobe": {"slug": "adobe", "color": "#FF0000"},
    "Intel": {"slug": "intel", "color": "#0071C5"}
}

def fetch_svg(slug, color):
    # Fetch from unpkg or jsdelivr for Simple Icons
    url = f"https://cdn.jsdelivr.net/npm/simple-icons@11/icons/{slug}.svg"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as response:
            svg_content = response.read().decode('utf-8')
            # Extract the path from the SVG
            match = re.search(r'<svg.*?(<path.*?>).*?</svg>', svg_content, re.DOTALL)
            if match:
                path = match.group(1)
                # Ensure the path has the correct fill
                if 'fill=' not in path:
                    path = path.replace('<path ', f'<path fill="{color}" ')
                else:
                    path = re.sub(r'fill="[^"]+"', f'fill="{color}"', path)
                
                # Wrap it in our standard SVG structure
                return f'<svg width="28" height="28" viewBox="0 0 24 24">{path}</svg>'
    except Exception as e:
        print(f"Failed to fetch {slug}: {e}")
    return None

def main():
    file_path = "reference/original.html"
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    # Find the usa-map-wrap block
    start_tag = "<!-- アメリカ地図 + 本社ピン -->"
    end_tag = "<!-- バナーカルーセル削除済み -->"
    start_idx = html.find(start_tag)
    end_idx = html.find(end_tag)

    if start_idx == -1 or end_idx == -1:
        print("Could not find the map section.")
        return

    map_block = html[start_idx:end_idx]

    # Iterate over our brands and replace the dummy SVGs
    for brand, info in brands.items():
        # Look for the exact usa-pin div for this brand
        # <div class="usa-pin" ... data-company="Google / DeepMind" ...>
        # ... <div class="usa-pin-label"><svg ...</svg>Google</div>
        
        # We need to find the specific block for the brand
        # Since names might differ slightly (like Google / DeepMind or xAI (Elon Musk))
        # Let's use regex to find the pin block
        brand_pattern = re.compile(r'class="usa-pin"[^>]*data-company="[^"]*' + re.escape(brand) + r'[^"]*".*?<div class="usa-pin-label">(<svg.*?</svg>)(.+?)</div>', re.DOTALL)
        
        match = brand_pattern.search(map_block)
        if match:
            old_svg = match.group(1)
            new_svg = fetch_svg(info["slug"], info["color"])
            
            if new_svg:
                # Replace the old SVG with the new SVG within this block
                map_block = map_block.replace(old_svg, new_svg)
                print(f"Replaced {brand} logo.")
            else:
                print(f"Warning: Could not get valid SVG for {brand}.")
        else:
            print(f"Did not find existing SVG to replace for {brand}")

    # Replace the updated map block back into html
    new_html = html[:start_idx] + map_block + html[end_idx:]

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_html)
    
    print("HTML updated successfully.")

if __name__ == "__main__":
    main()
