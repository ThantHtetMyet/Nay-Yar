import sys
try:
    from PIL import Image
    
    def remove_bg_with_tolerance(img_path, out_path, tolerance=200):
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # The shadow pixels are light gray. We can remove anything lighter than the tolerance.
            # R, G, B values of the shadow are high but not 255.
            # Let's say if all RGB values are above the tolerance, it's considered background.
            # The shadow is likely around (220, 220, 220) to (245, 245, 245).
            if item[0] > tolerance and item[1] > tolerance and item[2] > tolerance:
                # Calculate alpha based on how close it is to white to make edges smooth
                # If it's pure white (255), alpha is 0.
                # If it's at the tolerance level, alpha could be higher, but let's just make it fully transparent for now to completely kill the shadow.
                
                # To be completely safe and remove ALL the shadow pad, just make it 0.
                newData.append((255, 255, 255, 0)) 
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(out_path, "PNG")
        print(f"Successfully processed {img_path} with tolerance {tolerance}")
        
    # Using a relatively low tolerance to ensure all the light grey shadows are removed.
    # The house itself has vibrant colors (oranges, greens, blues), so their RGB values won't ALL be > 200 simultaneously.
    remove_bg_with_tolerance('src/assets/cute_3d_house.png', 'src/assets/cute_3d_house_transparent.png', tolerance=215)
except ImportError:
    print("PIL not installed. Please pip install Pillow.")
