# @abix5/pi-beads — dev targets
#
# There is no build step: the extension is loaded from src/ as-is.

SHOTS := $(shell node scripts/widget-shots.mjs --list)
IMAGES := $(SHOTS:%=docs/assets/%.png)

.PHONY: help test shots

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

test: ## Run the widget self-tests
	node --test src/widget-lines.test.mjs

shots: $(IMAGES) ## Regenerate the README screenshots from the shipped code (needs vhs + imagemagick)
	@ls -la docs/assets/*.png

# vhs drives a real terminal, so the widget's box-drawing glyphs come out the
# way a user's terminal draws them. The tape prints the REAL output of
# scripts/widget-shots.mjs; ImageMagick takes the last GIF frame, trims it to
# the content and re-pads it.
docs/assets/%.png: scripts/widget-shots.mjs docs/shots.tape src/widget-lines.mjs
	@mkdir -p docs/assets
	@echo "shot: $*"
	@SHOT=$* vhs docs/shots.tape -q
	@magick /tmp/beads-shot.gif -coalesce -delete 0--2 -fuzz 10% -trim +repage \
	  -bordercolor '#171717' -border 48 $@
	@rm -f /tmp/beads-shot.gif
