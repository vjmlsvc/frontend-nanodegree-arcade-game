SPIDERR
=======

Welcome to SIPDERR the latest and greatest from my living room.

Installation
------------
All you need to get the game running is a modern browser. Download all files
from [Github](https://github.com/vjmlsvc/frontend-nanodegree-arcade-game), then
simply open index.html in your browser.

Goal
----
The objective of the game is to get the highest score possible by guiding
successive spiders to their funnel webs at the bottom of the screen. Along the
way you must avoid ravenous birds and the rushing river.

Rules
-----
You start the game with 5 lives. You also have a limited amount of time for
each attempted crossing. There are several ways for you to die:

* Getting eaten by a bird
* Jumping into the river
* Being swept offscreen while on a koi or leaves
* Jumping anywhere other than an empty web at the bottom of the screen
* Running out of time

Tweaks
------
There are several constants that you could change in app.js if you'd like to
adjust the difficulty of the game. Number of LIVES, allotted TIME, movement
RATE factor for all entities, or even the MARGIN of error the game allows for
in collisions. Some combinations might not work perfectly, so remember the
default settings.

Version
-------
0.1 -- April 13, 2017: Playable game though there is still no menu, and deaths
feel somewhat abrupt.