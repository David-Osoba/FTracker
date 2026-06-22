from PIL import Image, ImageDraw

def draw_icon(size):
    # Create gradient image
    img = Image.new("RGBA", (size, size))
    
    # Draw purple-magenta gradient from top-left to bottom-right
    # Start: #7C5CFC (124, 92, 252)
    # End: #C850C0 (200, 80, 192)
    for y in range(size):
        for x in range(size):
            ratio = (x + y) / (2 * size)
            r = int(124 + ratio * (200 - 124))
            g = int(92 + ratio * (80 - 92))
            b = int(252 + ratio * (192 - 252))
            img.putpixel((x, y), (r, g, b, 255))

    # Recreate draw object on the gradient background
    draw = ImageDraw.Draw(img)
    
    # Scale factor
    scale = size / 512
    cx = size / 2
    cy = size / 2

    # Draw a stylized bold geometric white letter 'A'
    draw.polygon(
        [(cx - 25*scale, cy - 150*scale), (cx + 25*scale, cy - 150*scale), (cx - 95*scale, cy + 140*scale), (cx - 140*scale, cy + 140*scale)],
        fill=(255, 255, 255, 255)
    )
    draw.polygon(
        [(cx - 25*scale, cy - 150*scale), (cx + 25*scale, cy - 150*scale), (cx + 140*scale, cy + 140*scale), (cx + 95*scale, cy + 140*scale)],
        fill=(255, 255, 255, 255)
    )
    draw.polygon(
        [(cx - 55*scale, cy + 25*scale), (cx + 55*scale, cy + 25*scale), (cx + 65*scale, cy + 55*scale), (cx - 65*scale, cy + 55*scale)],
        fill=(255, 255, 255, 255)
    )

    img.save(f"icon-{size}.png", "PNG")
    print(f"Generated icon-{size}.png successfully.")

if __name__ == "__main__":
    draw_icon(192)
    draw_icon(512)
