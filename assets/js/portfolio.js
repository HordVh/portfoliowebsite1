/**
 * portfolio.js — Vova Siedykh Portfolio
 * Handles: preload removal, navbar scroll/active state,
 *          mobile menu toggle, scroll-reveal animations.
 */
(function () {
	'use strict';

	// ── Remove preload class (enables CSS transitions) ───────────
	window.addEventListener('load', function () {
		document.body.classList.remove('is-preload');
	});

	// ── Navbar: add .scrolled class on scroll ─────────────────────
	var topnav = document.getElementById('topnav');

	function onScroll() {
		if (window.scrollY > 20) {
			topnav.classList.add('scrolled');
		} else {
			topnav.classList.remove('scrolled');
		}
		updateActiveNav();
	}

	window.addEventListener('scroll', onScroll, { passive: true });

	// ── Navbar: highlight active section link ─────────────────────
	var sections   = ['hero', 'about', 'skills', 'projects', 'experience', 'contact'];
	var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

	function updateActiveNav() {
		var scrollPos = window.scrollY + 80;
		var current   = '';

		sections.forEach(function (id) {
			var el = document.getElementById(id);
			if (el && el.offsetTop <= scrollPos) {
				current = id;
			}
		});

		navAnchors.forEach(function (a) {
			a.classList.remove('active');
			if (a.getAttribute('href') === '#' + current) {
				a.classList.add('active');
			}
		});
	}

	// ── Mobile menu toggle ────────────────────────────────────────
	var navToggle = document.getElementById('navToggle');
	var navLinks  = document.getElementById('navLinks');

	navToggle.addEventListener('click', function () {
		navToggle.classList.toggle('open');
		navLinks.classList.toggle('open');
	});

	// Close mobile menu when a link is clicked
	navLinks.querySelectorAll('a').forEach(function (a) {
		a.addEventListener('click', function () {
			navToggle.classList.remove('open');
			navLinks.classList.remove('open');
		});
	});

	// ── Scroll-reveal via IntersectionObserver ────────────────────
	var revealEls = document.querySelectorAll('.reveal');

	if ('IntersectionObserver' in window) {
		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						// Stagger children within a parent reveal
						entry.target.classList.add('visible');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
		);

		revealEls.forEach(function (el, i) {
			// Slight stagger for sibling cards in a grid
			var parent = el.parentElement;
			if (parent) {
				var siblings = parent.querySelectorAll(':scope > .reveal');
				siblings.forEach(function (sib, j) {
					sib.style.transitionDelay = (j * 0.08) + 's';
				});
			}
			observer.observe(el);
		});
	} else {
		// Fallback: show all immediately
		revealEls.forEach(function (el) {
			el.classList.add('visible');
		});
	}

	// ── Skills: free-drag tags within each box (pointer events + FLIP) ──
	document.querySelectorAll('.skill-tags').forEach(function (container) {

		container.addEventListener('pointerdown', function (e) {
			var span = e.target.closest('span');
			if (!span || !container.contains(span)) return;

			var spanRect = span.getBoundingClientRect();
			var offsetX  = e.clientX - spanRect.left;
			var offsetY  = e.clientY - spanRect.top;
			var startX   = e.clientX;
			var startY   = e.clientY;
			var dragging = false;
			var clone    = null;
			var THRESHOLD = 5; // px — only start drag after moving this far

			function getSiblings() {
				return Array.from(container.querySelectorAll('span')).filter(function (s) {
					return s !== span;
				});
			}

			// Returns { nearest, before } based on clone's center position
			function resolveInsert(cloneLeft, cloneTop) {
				var cx = cloneLeft + spanRect.width  / 2;
				var cy = cloneTop  + spanRect.height / 2;
				var nearest = null, nearestDist = Infinity, before = true;
				getSiblings().forEach(function (s) {
					var r   = s.getBoundingClientRect();
					var scx = r.left + r.width  / 2;
					var scy = r.top  + r.height / 2;
					var d   = Math.hypot(cx - scx, cy - scy);
					if (d < nearestDist) {
						nearestDist = d;
						nearest     = s;
						before      = cx < scx;
					}
				});
				return { nearest: nearest, before: before };
			}

			function startDrag() {
				dragging = true;
				e.preventDefault();

				// Snapshot computed styles so the clone looks identical outside the DOM tree
				var computed      = window.getComputedStyle(span);
				var bg            = computed.background;
				var border        = computed.border;
				var color         = computed.color;
				var font          = computed.font;
				var letterSpacing = computed.letterSpacing;
				var textAlign     = computed.textAlign;
				var lineHeight    = computed.lineHeight;
				var padding       = computed.padding;
				var borderRadius  = computed.borderRadius;

				// Floating clone follows the pointer
				clone = span.cloneNode(true);
				clone.style.cssText =
					'position:fixed;' +
					'left:'          + spanRect.left  + 'px;' +
					'top:'           + spanRect.top   + 'px;' +
					'width:'         + spanRect.width + 'px;' +
					'margin:0;pointer-events:none;z-index:9999;' +
					'background:'    + bg           + ';' +
					'border:'        + border       + ';' +
					'color:'         + color        + ';' +
					'font:'          + font         + ';' +
					'letter-spacing:'+ letterSpacing+ ';' +
					'text-align:'    + textAlign    + ';' +
					'line-height:'   + lineHeight   + ';' +
					'padding:'       + padding      + ';' +
					'border-radius:' + borderRadius + ';' +
					'transition:transform 0.12s ease,box-shadow 0.12s ease;' +
					'transform:scale(1.12);' +
					'box-shadow:0 10px 28px rgba(0,0,0,0.55);' +
					'opacity:0.95;';
				document.body.appendChild(clone);
			}

			function onMove(e) {
				var dx = e.clientX - startX;
				var dy = e.clientY - startY;

				// Cross threshold — begin the drag
				if (!dragging && Math.hypot(dx, dy) >= THRESHOLD) {
					startDrag();
				}
				if (!dragging) return;

				var left = e.clientX - offsetX;
				var top  = e.clientY - offsetY;
				clone.style.left = left + 'px';
				clone.style.top  = top  + 'px';

				// Highlight nearest sibling
				var result = resolveInsert(left, top);
				getSiblings().forEach(function (s) { s.classList.remove('skill-drag-over'); });
				if (result.nearest) result.nearest.classList.add('skill-drag-over');
			}

			function onUp() {
				document.removeEventListener('pointermove', onMove);
				document.removeEventListener('pointerup',   onUp);

				// If threshold was never crossed, it was just a click — do nothing
				if (!dragging) return;

				getSiblings().forEach(function (s) { s.classList.remove('skill-drag-over'); });

				// FLIP — First: snapshot positions before DOM change
				var allSpans = Array.from(container.querySelectorAll('span'));
				var first = new Map();
				allSpans.forEach(function (s) {
					var r = s.getBoundingClientRect();
					first.set(s, { x: r.left, y: r.top });
				});

				// Reorder in DOM
				var result = resolveInsert(parseFloat(clone.style.left), parseFloat(clone.style.top));
				if (result.nearest) {
					if (result.before) {
						container.insertBefore(span, result.nearest);
					} else {
						container.insertBefore(span, result.nearest.nextSibling);
					}
				}

				// Fade clone out
				clone.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
				clone.style.opacity    = '0';
				clone.style.transform  = 'scale(0.85)';
				setTimeout(function () { clone.remove(); }, 200);

				// FLIP — Invert + Play: animate each span from its old position
				allSpans.forEach(function (s) {
					var f = first.get(s);
					if (!f) return;
					var l  = s.getBoundingClientRect();
					var dx = f.x - l.x;
					var dy = f.y - l.y;
					if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
					s.style.transition = 'none';
					s.style.transform  = 'translate(' + dx + 'px,' + dy + 'px)';
					requestAnimationFrame(function () {
						requestAnimationFrame(function () {
							s.style.transition = 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)';
							s.style.transform  = '';
							setTimeout(function () {
								s.style.transition = '';
								s.style.transform  = '';
							}, 380);
						});
					});
				});
			}

			document.addEventListener('pointermove', onMove);
			document.addEventListener('pointerup',   onUp);
		});
	});

})();
