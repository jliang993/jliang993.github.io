---
layout: post
title: Activities
description: Events and selected presentations
---


## Events organised

<ul style="margin-top:1rem; margin-right:1rem">
{% for item in site.data.act_event %}
<!-- {{ item }} -->
<li>
  {{ item.title }} <br> &emsp; {{ item.conference }}, {{ item.place }}, {{ item.date }}. <br> &emsp; Co-organised with: {{ item.co-organisers }}.
</li>
{% endfor %}
</ul>



## Selected presentations

<ul style="margin-top:1rem; margin-right:1rem">
{% for item in site.data.act_selected %}
<!-- {{ item }} -->
<li>
  {{ item.title }} <br> &emsp; {{ item.conference }}, {{ item.place }}, {{ item.date }}. 
</li>
{% endfor %}
</ul>





