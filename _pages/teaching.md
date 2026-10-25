---
layout: page
title: Teaching
permalink: /teaching/
description: Courses taught by Jingwei Liang.
nav: true
nav_order: 4
display_categories: [Graduate course, Undergraduate course]
---

<p class="site-page-lead">
  Current and recent courses in optimization and mathematical programming. Course pages contain descriptions, references, and available teaching materials.
</p>

<div class="site-course-directory">
  {% for category in page.display_categories %}
    {% assign courses = site.teaching | where: 'category', category | sort: 'importance' %}
    {% if courses.size > 0 %}
      {% assign category_id = category | slugify %}
      <section aria-labelledby="{{ category_id }}">
        <h2 id="{{ category_id }}" class="site-section-title">{{ category | capitalize }}</h2>
        <div class="site-course-directory__grid">
          {% for course in courses %}
            <article class="site-course-card">
              <h3><a href="{{ course.url | relative_url }}">{{ course.title }}</a></h3>
              {% if course.description %}<p>{{ course.description }}</p>{% endif %}
              <a class="site-course-card__link" href="{{ course.url | relative_url }}">Course details <span aria-hidden="true">→</span></a>
            </article>
          {% endfor %}
        </div>
      </section>
    {% endif %}
  {% endfor %}
</div>
