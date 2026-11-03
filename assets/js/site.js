(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  var navList = nav.querySelector("ul");

  /* ---------- Mobile menu ---------- */
  function setOpen(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".menu-toggle__label").textContent = open ? "Close" : "Menu";
    nav.classList.toggle("is-open", open);
  }
  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  /* ---------- Nav: current section + sliding indicator ---------- */
  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) {
    links[a.getAttribute("href").slice(1)] = a;
  });

  var indicator = document.createElement("span");
  indicator.className = "nav-indicator";
  indicator.setAttribute("aria-hidden", "true");
  navList.appendChild(indicator);
  nav.classList.add("has-indicator");

  function moveIndicator() {
    var current = nav.querySelector('a[aria-current="true"]:not(.button)');
    if (!current) {
      indicator.style.opacity = "0";
      return;
    }
    var listBox = navList.getBoundingClientRect();
    var box = current.getBoundingClientRect();
    var pad = 11; // matches the link's side padding
    indicator.style.left = box.left - listBox.left + pad + "px";
    indicator.style.width = Math.max(0, box.width - pad * 2) + "px";
    indicator.style.opacity = "1";
  }

  function setCurrent(id) {
    Object.keys(links).forEach(function (key) {
      if (key === id) links[key].setAttribute("aria-current", "true");
      else links[key].removeAttribute("aria-current");
    });
    moveIndicator();
  }

  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    document.querySelectorAll("main section[id]").forEach(function (s) {
      sectionObserver.observe(s);
    });
    // Clear the indicator when back at the hero
    var hero = document.querySelector(".hero");
    new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) setCurrent(null);
      },
      { rootMargin: "-45% 0px -50% 0px" }
    ).observe(hero);
  }
  window.addEventListener("resize", moveIndicator);

  /* ---------- Scroll: header rule, progress, experience traverse ---------- */
  var timeline = document.querySelector(".timeline");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 8);

    var max = root.scrollHeight - window.innerHeight;
    header.style.setProperty("--progress", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");

    if (timeline && !reduceMotion.matches) {
      var r = timeline.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 when the top of the list reaches 85% of the viewport, 1 when its bottom reaches 55%
      var start = vh * 0.85;
      var end = vh * 0.55;
      var p = (start - r.top) / (r.height + (start - end));
      timeline.style.setProperty("--traverse", Math.max(0, Math.min(1, p)).toFixed(4));
    }
    ticking = false;
  }
  onScroll();
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  /* ---------- Contact terrain: reuse the hero map ---------- */
  var heroMap = document.querySelector(".summit .contours");
  var terrain = document.querySelector(".contact__terrain");
  if (heroMap && terrain) {
    var copy = heroMap.cloneNode(true);
    copy.removeAttribute("class");
    terrain.appendChild(copy);
  }

  /* ---------- Scroll reveals ---------- */
  var revealables = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    root.classList.add("reveal-ready");

    document.querySelectorAll(".project").forEach(function (project) {
      project.querySelectorAll(".tags li").forEach(function (li, i) {
        li.style.setProperty("--t", i);
      });
    });

    var revealObserver = new IntersectionObserver(
      function (entries, obs) {
        var batch = entries.filter(function (e) {
          return e.isIntersecting;
        });
        batch.forEach(function (entry, i) {
          // Items arriving together stagger slightly; single items appear right away
          entry.target.style.setProperty("--d", Math.min(i, 5) * 80 + "ms");
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealables.forEach(function (el) {
      revealObserver.observe(el);
    });

    var contact = document.querySelector(".contact");
    new IntersectionObserver(
      function (entries, obs) {
        if (entries[0].isIntersecting) {
          contact.classList.add("is-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    ).observe(contact);
  }

  /* ---------- Hero: the terrain tilts toward the pointer ----------
     Each contour shifts by its elevation, so the summit (and the photo on it)
     moves most and the map reads as a raised surface. Scrolling adds a little
     lift too, so touch devices get depth without a pointer. */
  var summit = document.querySelector(".summit");
  if (summit && heroMap && !reduceMotion.matches) {
    var layers = Array.prototype.map.call(heroMap.querySelectorAll("path"), function (p) {
      return { el: p, depth: 1 - parseFloat(p.style.getPropertyValue("--i") || "0") };
    });
    var photo = summit.querySelector(".summit__photo");
    var target = { x: 0, y: 0 };
    var pos = { x: 0, y: 0 };
    var running = false;
    var heroVisible = true;
    var MAX = 26; // px of travel at the summit

    function frame() {
      var scrollLift = Math.min(window.scrollY, 600) * -0.06;
      pos.x += (target.x - pos.x) * 0.08;
      pos.y += (target.y + scrollLift - pos.y) * 0.08;

      for (var i = 0; i < layers.length; i++) {
        var d = layers[i].depth * layers[i].depth;
        layers[i].el.style.translate = (pos.x * d).toFixed(2) + "px " + (pos.y * d).toFixed(2) + "px";
      }
      photo.style.translate = pos.x.toFixed(2) + "px " + pos.y.toFixed(2) + "px";

      var settled = Math.abs(target.x - pos.x) < 0.05 && Math.abs(target.y + scrollLift - pos.y) < 0.05;
      if (heroVisible && !settled) {
        window.requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }
    function kick() {
      if (!running && heroVisible) {
        running = true;
        window.requestAnimationFrame(frame);
      }
    }

    if (finePointer.matches) {
      window.addEventListener(
        "pointermove",
        function (e) {
          var box = summit.getBoundingClientRect();
          var cx = box.left + box.width / 2;
          var cy = box.top + box.height / 2;
          var nx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth / 2)));
          var ny = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight / 2)));
          target.x = nx * MAX;
          target.y = ny * MAX;
          kick();
        },
        { passive: true }
      );
      document.addEventListener("pointerleave", function () {
        target.x = 0;
        target.y = 0;
        kick();
      });
    }
    window.addEventListener("scroll", kick, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) kick();
      }).observe(summit);
    }
  }
})();
