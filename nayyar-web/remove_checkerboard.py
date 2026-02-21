import sys
try:
    from PIL import Image
    
    def remove_checkerboard(img_path, out_path):
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            r, g, b, a = item
            
            # The fake transparent background is a checkerboard of white and light grey.
            # Both white and light grey have R, G, B values very close to each other.
            # And they are both relatively bright (e.g. > 180).
            if abs(r-g) < 15 and abs(r-b) < 15 and abs(g-b) < 15 and r > 180:
                newData.append((255, 255, 255, 0)) 
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(out_path, "PNG")
        print(f"Successfully removed checkerboard from {img_path}")
        
    remove_checkerboard('src/assets/new_cute_3d_house.png', 'src/assets/new_cute_3d_house_transparent.png')
except ImportError:
    print("PIL not installed. Please pip install Pillow.")
