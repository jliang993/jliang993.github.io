---
layout: page # no need to modify
title: Activity 
permalink: /activities/
description: Under construction.
nav: true
nav_order: 5
---

<!-- This page contains recent events I involved,  -->


<div class="activity">
    <!-- Event organized -->
    <h4>
        <a href="/activities/events" style="color: inherit">Recent events</a>
    </h4>
    {% include activity_events.liquid file="events" limit=3 %}

    <!-- Talks posts -->
    <h4>
        <a href="/activities/talks" style="color: inherit">Recent talks</a>
    </h4>
    {% include activity_talks.liquid  file="talks" limit=3 %}

    <!-- Services -->
    <h4>
        <a href="/activities/services" style="color: inherit">Services</a>
    </h4>
    {% include activity_services.liquid file="services" %}

</div>