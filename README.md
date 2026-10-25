# Jingwei Liang — academic website

Source for [jliang993.github.io](https://jliang993.github.io/). The site uses Jekyll and the gem-based al-folio v1 architecture; personal content and components are kept as a small, explicit override layer.

## Local development

```bash
bundle install
npm ci
bundle exec jekyll serve
```

Open <http://127.0.0.1:4000/>. Before committing, run:

```bash
ruby scripts/validate_content.rb
bundle exec al-folio upgrade audit
bundle exec al-folio upgrade overrides audit --fail-on-stale
bundle exec jekyll build
npx prettier . --check
```

## Content locations

- `_pages/`: top-level pages and legacy URL redirects
- `_bibliography/papers.bib`: publications authored or co-authored by Jingwei Liang
- `_people/` and `_data/cv/`: group profiles and structured CV data
- `_teaching/`: course pages; downloadable material is in `assets/teaching/`
- `_activities/` and `_data/activity/`: events, talks, and service
- `_news/`: dated announcements

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before upgrading the theme or changing shared components.

## Deployment

GitHub Actions validates and builds pull requests. A push to `master` deploys the generated `_site` directory to the `gh-pages` branch.
