# One tape for every README shot. The shot name arrives in $SHOT (the shell vhs
# drives expands it), so the frame always shows the REAL output of
# scripts/widget-shots.mjs — never a hand-written line. `make shots` runs this
# once per shot; ImageMagick then takes the last GIF frame, trims it to the
# content and re-pads it. vhs drives a real terminal, so the box-drawing glyphs
# render the way a user's terminal draws them.
Output "/tmp/beads-shot.gif"
Set FontSize 26
Set Width 1500
Set Height 800
Set Padding 24
Set Margin 0
Hide
Type "PS1=''"
Enter
Sleep 300ms
Type "clear; node scripts/widget-shots.mjs $SHOT; printf '\e[?25l'"
Enter
Sleep 1.5s
Show
Sleep 2s
