---
layout: maths
title: Research
description: Research interests
---

My research interests include the follwing main aspects
- Convergence rate of first-order methods
- Acceleration of first-order methods
- Stochastic optimization
- Imaging problem and data science



## Convergence rate of first-order methods


I started my research career in 2010 with master study at the Department of Mathematics at Shanghai Jiao Tong University China, where I worked on mathematical image processing. I published three papers on image reconstruction and enhancement. 
            
            
I began my PhD from 2013, which was funded by the ERC starting grant $\Sigma$-Vision. My PhD work mainly focused on convergence rate analysis of first-order operator splitting methods which are widely used in, for instance, image processing, inverse problems, statistics and machine learning. 

- My first PhD project was studying the convergence rates of generic \KM fixed-point iteration, which covered various previous results as special cases. The result was published in Mathematical Programming which is one of the leading journals in optimisation and operation research. 

- The major contribution of my PhD work is a unified framework for analysing the local linear convergence of first-order methods for non-smooth optimisation, which is the first time in the literature, despite local linear convergence phenomena having been observed for decades. The obtained results were published in top journals including SIAM Journal on Optimization and leading machine learning conferences including Neural Information Processing System (NIPS) and International Conference on Machine Learning (ICML).

After joining Cambridge Image Analysis group from 2017, I began to work on the geometric perspective of non-smooth optimisation and beyond, which provides a better understanding of the problems arising from non-smooth optimisation and other related fields including set-valued analysis, control theory and operation research. In turn, it impacts both algorithm design and related research areas such as sensitivity analysis and optimal control. 

I am also working on analysing existing acceleration techniques, in particular the inertial technique. For this direction, I am collaborating with people from Cambridge and outside the UK (China, France and the US) to design problem oriented acceleration schemes. 



#### References

<ol>
{% for item in site.data.pub_category.toc[0].papers %}
    <li>
	  <a href="{{ item.url }}">{{ item.title }}</a>: {{ item.authors }}{% if item.venue %}, {{ item.venue }}{% endif %}, {{ item.year }}. 
    </li>
{% endfor %}
</ol>

## Acceleration of first-order methods


#### References

<ol start="13">
{% for item in site.data.pub_category.toc[1].papers %}
    <li>
	  <a href="{{ item.url }}">{{ item.title }}</a>: {{ item.authors }}, {{ item.venue }}, {{ item.year }}. 
    </li>
{% endfor %}
</ol>


## Stochastic optimization


#### References

<ol start="18">
{% for item in site.data.pub_category.toc[2].papers %}
    <li>
	  <a href="{{ item.url }}">{{ item.title }}</a>: {{ item.authors }}, {{ item.venue }}, {{ item.year }}. 
    </li>
{% endfor %}
</ol>

## Imaging problem and data science


#### References
<ol start="21">
{% for item in site.data.pub_category.toc[3].papers %}
    <li>
	  <a href="{{ item.url }}">{{ item.title }}</a>: {{ item.authors }}, {{ item.venue }}, {{ item.year }}. 
    </li>
{% endfor %}
</ol>



Text can be **bold**, _italic_, or ~~strikethrough~~.

[Link to another page](./another-page.html).

There should be whitespace between paragraphs.

There should be whitespace between paragraphs. We recommend including a README, or a file with information about your project.

# Header 1

This is a normal paragraph following a header. GitHub is a code hosting platform for version control and collaboration. It lets you and others work together on projects from anywhere.

## Header 2

> This is a blockquote following a header.
>
> When something is important enough, you do it even if the odds are not in your favor.

### Header 3

``` js
// Javascript code with syntax highlighting.
var fun = function lang(l) {
dateformat.i18n = require('./lang/' + l)
return true;
}
```

``` ruby
# Ruby code with syntax highlighting
GitHubPages::Dependencies.gems.each do |gem, version|
s.add_dependency(gem, "= #{version}")
end
```

#### Header 4

*   This is an unordered list following a header.
*   This is an unordered list following a header.
*   This is an unordered list following a header.

##### Header 5

1.  This is an ordered list following a header.
2.  This is an ordered list following a header.
3.  This is an ordered list following a header.

###### Header 6

| head1        | head two          | three |
|:-------------|:------------------|:------|
| ok           | good swedish fish | nice  |
| out of stock | good and plenty   | nice  |
| ok           | good `oreos`      | hmm   |
| ok           | good `zoute` drop | yumm  |

### There's a horizontal rule below this.

<!-- * * * -->

### Here is an unordered list:

*   Item foo
*   Item bar
*   Item baz
*   Item zip

### And an ordered list:

1.  Item one
1.  Item two
1.  Item three
1.  Item four

### And a nested list:

- level 1 item
- level 2 item
- level 2 item
 - level 3 item
 - level 3 item
- level 1 item
- level 2 item
- level 2 item
- level 2 item
- level 1 item
- level 2 item
- level 2 item
- level 1 item

### Small image

![Octocat](https://github.githubassets.com/images/icons/emoji/octocat.png)

### Large image

<!-- ![Branching](https://guides.github.com/activities/hello-world/branching.png) -->


### Definition lists can be used with HTML syntax.

<dl>
<dt>Name</dt>
<dd>Godzilla</dd>
<dt>Born</dt>
<dd>1952</dd>
<dt>Birthplace</dt>
<dd>Japan</dd>
<dt>Color</dt>
<dd>Green</dd>
</dl>



<!-- ```
Long, single-line code blocks should not wrap. They should horizontally scroll if they are too long. This line should be long enough to demonstrate this.
``` -->

```
The final element.
```
