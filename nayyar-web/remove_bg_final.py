import sys
try:
    from PIL import Image
    
    def remove_pure_white_bg(img_path, out_path):
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # We ONLY want to remove the absolute white background.
            # We must keep the shadows and the base of the house.
            # If r, g, b are almost perfectly white (e.g., > 245), we remove them.
            if item[0] > 245 and item[1] > 245 and item[2] > 245:
                newData.append((255, 255, 255, 0)) 
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(out_path, "PNG")
        print(f"Successfully processed {img_path}, returning the base and shadows!")
        
    remove_pure_white_bg('src/assets/cute_3d_house.png', 'src/assets/cute_3d_house_transparent.png')
except ImportError:
    print("PIL not installed. Please pip install Pillow.")
