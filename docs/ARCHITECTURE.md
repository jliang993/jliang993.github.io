# Site architecture and al-folio upgrades

## Design boundary

The upstream theme is supplied by the versioned `al_folio_core` gem. Do not copy the full upstream `_layouts`, `_includes`, `_sass`, or JavaScript trees into this repository. Local files exist only where the personal site deliberately changes behavior.

The local override layer uses a `site-*` namespace:

- `_layouts/site-*.liquid`
- `_includes/site/`
- `_sass/site/` and `_sass/_site.scss`
- `assets/js/site-*.js`

`_layouts/default.liquid` and `assets/css/main.scss` override upstream files and are tracked in `.al-folio-overrides.yml`. All other theme behavior should continue to come from the gem.

## Content model

- Publications live in the single file `_bibliography/papers.bib`. `cate_primary` and `cate_secondary` use IDs from `_data/publication_topics.yml`. `site_members` contains comma-separated profile IDs when a publication should appear on a group member's page.
- Each `_people/<id>.md` profile uses the same lowercase `<id>` for `member_id` and `cv`; its structured sections live in `_data/cv/<id>.yml`.
- Events and talks use ISO `start_date` and `end_date` values plus a human-readable `date_display`. Services are grouped by `service` or `review` type.
- News filenames use `YYYY-MM-DD-short-slug.md` and declare `kind`, `inline`, and `related_posts`.
- When renaming a published URL, add a small redirect page in `_pages/` instead of silently breaking the old link.

`ruby scripts/validate_content.rb` enforces these conventions before build and deployment.

## Theme upgrade procedure

1. Read the al-folio release notes and update the three exact gem versions in `Gemfile`.
2. Refresh `Gemfile.lock` with Bundler.
3. Run `bundle exec al-folio upgrade audit`.
4. Run `bundle exec al-folio upgrade overrides audit --fail-on-stale` and review every stale override rather than replacing local files wholesale.
5. Build the site, run content validation and accessibility checks, and inspect the main pages at desktop and mobile widths.
6. Merge through a pull request so GitHub Actions verifies the same build used for deployment.

This keeps routine al-folio updates limited to dependency changes and the few files listed in the override manifest.
