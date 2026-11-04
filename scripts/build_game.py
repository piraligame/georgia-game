#!/usr/bin/env python3
"""GEORGIA player build; authored in independent game/style sources.

Read-only reference for the design system: PIRALI Game, but this builder
only reads GEORGIA src/. Never imports or mutates any PIRALI repository.
"""
from pathlib import Path
import hashlib

ROOT=Path(__file__).resolve().parent.parent
SOURCES=['00-scene-environment.js', '10-characters-animation.js', '20-castle-defense.js', '30-economy-village.js', '40-game-state-controls.js', '50-chapters-enemies-siege.js', '60-checkpoints-pause.js', '70-building-sites.js', '80-allied-army-villagers.js', '90-battle-rewards-skills.js', '91-ui-hud.js', '92-enemy-models-combat.js', '93-weapons-construction.js', '94-update-render-loop.js', '95-joystick-touch-input.js', '99-developer-only.js']
STYLES=['00-base-hud.css', '10-language-ui.css', '20-thumb-controls.css', '30-pirali-game-brand.css']
def join_files(folder,names):
  return ''.join((ROOT/folder/n).read_text(encoding="utf-8") for n in names)
def write(path,content):
  content=content.rstrip(chr(10)+chr(13))+chr(10)
  path.write_text(content,encoding="utf-8")
  print("BUILT",path.name,"lines",len(content.splitlines()),"sha256",hashlib.sha256(content.encode("utf-8")).hexdigest()[:12])
def main():
  common=join_files("src/game",SOURCES[:-1])
  developer=join_files("src/game",SOURCES)
  write(ROOT/"main.js",common)
  write(ROOT/"dev-main.js",developer)
  write(ROOT/"style.css",join_files("src/styles",STYLES))
  # Browser and Android Player use main.js; developer.html is local QA only.
if __name__=="__main__":main()
