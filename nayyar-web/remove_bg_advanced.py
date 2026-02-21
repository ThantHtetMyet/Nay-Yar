import sys
try:
    from PIL import Image
    
    def isolate_house(img_path, out_path):
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            r, g, b, a = item
            
            # The house consists of vibrant colors.
            # Shadows are usually greyscale (r, g, b values are very close to each other).
            # We can calculate the maximum difference between r, g, and b.
            # If the difference is small, it's a shade of grey/black/white.
            
            rg_diff = abs(r - g)
            rb_diff = abs(r - b)
            gb_diff = abs(g - b)
            
            max_diff = max(rg_diff, rb_diff, gb_diff)
            
            # If max_diff is small (e.g., < 25), it's close to greyscale (shadow/background)
            # Also, if it's very white (all values > 200), remove it.
            # Also, if it's very dark (all values < 50), remove it.
            
            if max_diff < 35 or (r > 200 and g > 200 and b > 200):
                # It's a shadow, white background, or very dark grey. Make it transparent.
                newData.append((255, 255, 255, 0)) 
            else:
                # It has enough color saturation to be part of the house
                newData.append(item)
                
        img.putdata(newData)
        img.save(out_path, "PNG")
        print(f"Successfully isolated colored house from {img_path}")
        
    isolate_house('src/assets/cute_3d_house.png', 'src/assets/cute_3d_house_transparent.png')
except ImportError:
    print("PIL not installed. Please pip install Pillow.")
