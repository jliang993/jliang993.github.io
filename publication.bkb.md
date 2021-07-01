---
layout: maths
title: Publications
description: Preprints, Journal papers, Conference proceedings
---



<!-- #### Publications -->

<!-- Tab links -->
<!-- <div class="tab" style="margin-top:1rem;">
  <button class="tablinks" onclick="openType(event, 'preprint')" id="defaultOpen" style="color: #2eb82e;">Preprints</button>
</div> -->

## Preprints 

<!-- Tab content -->
<!-- <div id="preprint" class="tabcontent"> -->
  <ol reversed>
  {% for item in site.data.journal.toc[0].papers %}
      <li>
        <a href="{{ item.url }}">{{ item.title }}</a> <br> &emsp;{{ item.authors }}, {{ item.year }}. {% if item.misc %} ({{ item.misc }}) {% endif %}
      </li>
  {% endfor %}
  </ol>



<!-- <div class="tab" style="margin-top:1rem;">
  <button class="tablinks" onclick="openType(event, 'journal')" id="defaultOpen" style="color: #0066ff;">Journal papers</button>
</div> -->
  
## Journal papers 

<!-- <div id="journal" class="tabcontent"> -->
<ol reversed>
{% for item in site.data.journal.toc[1].papers %}
    <li>
	  <a href="{{ item.url }}">{{ item.title }}</a> <br> &emsp;{{ item.authors }}, <i>{{ item.journal }}</i>, {{ item.volume }}:{{ item.page }}, {{ item.year }}. {% if item.misc %} ({{ item.misc }}) {% endif %}
    </li>
{% endfor %}
</ol>
<!-- </div> -->


<!-- <div class="tab" style="margin-top:1rem;">
  <button class="tablinks" onclick="openType(event, 'conference')" id="defaultOpen" style="color: #ff3333;">Conference proceedings</button>
</div> -->


## Conference proceedings

<!-- <div id="conference" class="tabcontent"> -->
<ol reversed>
{% for item in site.data.conference %}
<!-- {{ item }} -->
    <li>
      <a href="{{ item.url }}">{{ item.title }}</a> <br> &emsp;{{ item.authors }}, <b><i>{{ item.conference }}</i></b>, {{ item.year }}. {% if item.misc %} ({{ item.misc }}) {% endif %}
    </li>
{% endfor %}
</ol>
<!-- </div> -->


<!-- <div class="tab" style="margin-top:1rem;">
  <button class="tablinks" onclick="openType(event, 'thesis')" id="defaultOpen" style="color: #646464;">PhD thesis</button>
</div> -->

## PhD Thesis 
<!-- <div id="thesis" class="tabcontent"> -->
<ul style="margin-left:1.5rem; padding:0;">
    <li>
      <b>Title:</b> <a href="assets/files/thesis.pdf">Convergence Rates of First-Order Splitting Methods</a>
    </li>
    <li>
      <b>Chapter 4</b> contains unpublished result on a general multi-step inertial operator splitting scheme for monotone inclusion problem, which can be used to derive multi-step inertial versions of 
          <ul>
              <li>Forward--Backward splitting, Generalized Forward--Backward, Forward--Douglas--Rachford splitting</li> 
              <li>A class of Primal--Dual splitting methods</li> 
              <li>Proximal Point Algorithm, Douglas--Rachford splitting and Alternating Direction Method of Multipliers (ADMM)</li>
          </ul>
    </li>
</ul>
<!-- </div> -->
