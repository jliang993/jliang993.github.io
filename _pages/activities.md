---
layout: page
title: Activities
permalink: /activities/
description: Selected events, talks, and academic service.
nav: true
nav_order: 5
---

<p class="site-page-lead">
  Selected academic events, invited talks, and professional service. Follow each section for the complete archive.
</p>

<section class="site-activity-overview" aria-labelledby="recent-events">
  <div class="site-section-heading">
    <h2 id="recent-events" class="site-section-title">Recent events</h2>
    <a href="{{ '/activities/events/' | relative_url }}">All events <span aria-hidden="true">→</span></a>
  </div>
  {% include site/activity-events.liquid file="events" limit=3 %}
</section>

<section class="site-activity-overview" aria-labelledby="recent-talks">
  <div class="site-section-heading">
    <h2 id="recent-talks" class="site-section-title">Recent talks</h2>
    <a href="{{ '/activities/talks/' | relative_url }}">All talks <span aria-hidden="true">→</span></a>
  </div>
  {% include site/activity-talks.liquid file="talks" limit=3 %}
</section>

<section class="site-activity-overview" aria-labelledby="academic-service">
  <div class="site-section-heading">
    <h2 id="academic-service" class="site-section-title">Academic service</h2>
    <a href="{{ '/activities/services/' | relative_url }}">Full service record <span aria-hidden="true">→</span></a>
  </div>
  {% include site/activity-services.liquid file="services" limit=true %}
</section>
