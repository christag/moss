# Strategy

## Do
Use easily recognizable icons or illustrations that have a clear focal point.
Arrange elements in a logical, easy-to-follow order.
Use scale and color to emphasize the most important parts of the design.
Ensure there is sufficient contrast between text and background.
Offer text alternatives for images and multimedia content.
Design layouts that work on all devices and screen sizes.

## Don't
Use colors that can feel aggressive or overwhelming.
Rely on visually negative or menacing aesthetic decisions.
Rely solely on abstract graphics or text.
Rely solely on color to communicate important information.
Create complicated or hidden navigation paths.
Use font sizes that are too small to read easily.

# Layout

## Grid

The grid is our primary reference while assembling a piece’s composition. The columns’ sizes follow a symmetrical proportion between themselves. As a result, we have a flexible grid system that allows the canvas width to determine the number of columns. 

1. Set the number of columns: Using even numbers, determine how many columns best fit your composition.
2. Set the margins: To create the margins, divide the column width into equal parts. 1/4 column width = margin. 
3. Set the gutter: After setting margins, divide the margin width into equal parts. 1/2 margin = gutter.
4. Equalize the columns: Redistribute the guides to keep the column widths equal. 

# Text

## FONTS
Inter can be used for headings and body copy.

## SCALE
Our type scale has a base of 18 and scale of 1.25. Using an appropriate scale is necessary for creating a hierarchy that’s easily understood. 

## MARGINS AND ALIGNMENT
Always use consistent margins and generous padding when left aligning type in a composition.
Don’t allow type to overflow into the margins or crowd the composition.
Always align typography to the grid.
Don’t misalign type from the grid or allow elements to ‘float.’
Always use scale to create emphasis.
Don’t use text case to create emphasis.

# COLOR

## Primary palette

For consistency and brand recognition the colors used in the primary palette should be dominant in most applications. 
[
  {
    "name": "Morning Blue",
    "CMYK": "88/48/0/5",
    "RGB": "28/127/242",
    "HEX": "#1C7FF2"
  },
  {
    "name": "Brew Black",
    "CMYK": "0/11/9/86",
    "RGB": "35/31/32",
    "HEX": "#231F20"
  },
  {
    "name": "Off White",
    "CMYK": "0/0/2/2",
    "RGB": "250/249/245",
    "HEX": "#FAF9F5"
  }
]

## Secondary palette

The secondary palette is meant to compliment, never overpower the primary palette.
[
  {
    "name": "Green",
    "CMYK": "79/0/38/25",
    "RGB": "40/192/119",
    "HEX": "#28C077"
  },
  {
    "name": "Lime Green",
    "CMYK": "23/0/55/4",
    "RGB": "188/244/110",
    "HEX": "#BCF46E"
  },
  {
    "name": "Light Blue",
    "CMYK": "33/16/0/0",
    "RGB": "172/215/255",
    "HEX": "#ACD7FF"
  },
  {
    "name": "Orange",
    "CMYK": "0/58/76/1",
    "RGB": "253/106/61",
    "HEX": "#FD6A3D"
  },
  {
    "name": "Tangerine",
    "CMYK": "0/27/64/0",
    "RGB": "255/187/92",
    "HEX": "#FFBB5C"
  }
]

## Color Combinations and Layering

{
    "approvedColorCombinations" : 
    {
      "fontOnBackground": {
        "Morning Blue": ["Brew Black", "Off White"],
        "Green": ["Brew Black", "Off White"],
        "Orange": ["Brew Black", "Off White"],
        "Light Blue": ["Brew Black"],
        "Lime Green": ["Brew Black"],
        "Tangerine": ["Brew Black"],
        "Off White": ["Morning Blue", "Brew Black"],
        "Brew Black": "All other Colors"
      },
      "blockLayering": [
        { "top": "Morning Blue", "bottom": "Light Blue" },
        { "top": "Tangerine", "bottom": "Orange" },
        { "top": "Green", "bottom": "Lime Green" },
        { "top": "White", "bottom": "Morning Blue" },
        { "top": "Black", "bottom": "Any color except Off White" }
      ]
    }
}    