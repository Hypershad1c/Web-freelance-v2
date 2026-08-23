# Arabic buyer-page RTL audit — 22 August 2026

The Arabic header, footer navigation, and locale switcher load correctly. The property-detail content still mixes French labels, left-to-right breadcrumb order, and unmirrored action/card alignment despite Arabic navigation. The financing calculator uses French-only buyer labels and left-to-right arrows.

The correction scope is therefore limited to the highest-traffic buyer routes: property details and the bank-branded financing calculator. It will apply Arabic labels, `dir="rtl"`, right-aligned hierarchy, mirrored reading order, and directional icon treatment while retaining numbers, prices, bank names, and email/phone values in their appropriate display direction.

Local verification confirmed that the updated calculator route loads in French with its complete branded bank-selection grid. The next review switches the local locale cookie to Arabic to validate the mirrored experience before release.

Arabic local verification passed for the calculator. The bank-selection cards render right-to-left with Arabic labels, while Latin bank names and MAD figures retain readable isolation. The simulation mirrors the desktop panels, reverses directional arrows, and localizes sliders, rate disclosures, the buyer-only enquiry section, select options, form placeholders, and the no-offer disclaimer.

The local property-details route cannot load data because this workspace intentionally has no development database credentials. Its TypeScript and production build validation passed; live production verification will follow deployment, where the route can query the configured database.

The deployment attached to commit `4416ea1` reported successful completion. An immediate browser check of the production property URL encountered a transient `ERR_TIMED_OUT`; this was a connectivity response rather than an application error, so a retry is required for the final live database-backed property check.

The production retry passed. The property-detail page now shows Arabic breadcrumbs, sale and verification badges, fact labels, description and reference labels, financing teaser, amenities and location headings, Domify support copy, contact-card labels and enquiry placeholders. The Arabic detail container applies RTL direction, mirrors the desktop content/sidebar order, and preserves property names, bank names, telephone numbers, references, and MAD figures as readable mixed-direction values.

The live calculator check also passed. The Arabic bank-selection heading, descriptions, card labels, accessible choice labels, action arrows, and rate disclaimer are deployed on `domify.ma/calculateur-credit`; each branded bank card remains selectable for the existing purchase-only simulation and enquiry flow.

The browser automation session did not persist the optional live bank-card state transition despite invoking the card control. This did not indicate an application error: the same Arabic simulation and enquiry state was verified locally, and the deployed production bank-selection DOM exposes the expected interactive controls and translated labels. No production lead was submitted during validation.

## Follow-up public-page audit — 23 August 2026

The public catalogue is only partially Arabic. Filter categories and some controls are translated, but the hero, result count, collection introduction, map CTA, multiple property-card badges and metadata, reusable attribute values, and WhatsApp/call actions remain French. The current layout also retains left-to-right card and filter-panel alignment in several desktop areas.

The map-discovery page is similarly French-first in its hero, result count, map heading, filter CTA, listing cards, and detail actions. The map canvas itself should remain map-native, but surrounding discovery content, control order, and result-card presentation require Arabic copy and RTL-aware layout.

The neighbourhood index has an Arabic hero and primary CTA but leaves its city captions, neighbourhood descriptions, and property counts in French. Its cards should use Arabic status copy and natural RTL alignment while preserving proper nouns such as city and neighbourhood names.

The agency directory is almost entirely French in its heading, trust count, agency statistics, and description. It needs locale-aware directory copy and right-aligned agency cards; agency names can remain source-language identifiers where an Arabic brand label is unavailable.

The owner submission journey is currently French-first from the headline through its verification explanation, benefit cards, wizard steps, sell/rent choice, input prompts, and navigation. This is a priority because it captures seller conversion; the entire multi-step form needs an Arabic locale record and RTL-aware step sequence.

The editorial hub is French-only in its title, description, category filters, article labels, headlines, summaries, and dates. Blog content should use Arabic editorial fields where available, then a clearly defined fallback rather than presenting a page that appears Arabic only in navigation.

The contact journey mixes Arabic helper copy with French hero text, form placeholders, and submission action. Its input order and button alignment must be mirrored and locale-aware to avoid a broken Arabic inquiry experience.

The property-comparison empty state is entirely French, including its headline, explanation, and both discovery CTAs. It needs full Arabic copy and directional button ordering before comparison becomes a coherent Arabic buyer journey.

The investment calculator remains predominantly French in its headline, explanatory copy, slider labels, result metrics, discovery CTA, and investment disclaimer. Its financial labels need Arabic copy and RTL treatment while retaining isolated MAD figures and the existing informational, non-advisory disclaimer.

The FAQ contains Arabic answers for most entries but still has French page framing, one French WhatsApp question, and a French support CTA. The shared FAQ heading, all question labels, CTA copy, and accordion icon direction need completion.

## Implementation priority

The first correction batch should address the shared `PropertyCard`, the catalogue shell and empty states, and the map-discovery route and view. These components fix the repeated French badges, monthly-payment labels, metadata, CTA labels, map results, and discovery hierarchy seen by buyers before they open a property.

The second batch should complete the seller submission wizard and its `/vendre-louer` shell. The third batch should cover focused utility routes—contact, comparison, investment calculator, FAQ, neighbourhoods, agencies, and the blog—followed by account, seller-portal, legal, authentication, and secondary editorial routes. Dynamic content will use Arabic fields when present and retain clearly scoped source-language fallbacks when it is not translated in the database.

The current `BlogPost` schema stores a single title, excerpt, and body without Arabic variants. Blog navigation and generic interface copy can be translated safely, but a genuinely Arabic article experience requires Arabic content fields and editorial translations rather than automatic replacement of published source content.

Local verification after the expanded implementation confirms Arabic catalogue headings, recovery states, filters, and RTL ordering render correctly. The investment calculator also renders Arabic slider labels, result metrics, an Arabic informational disclaimer, and direction-safe MAD figures. The local preview intentionally has no development database, so catalogue cards and map records require final production verification against live data.

The expanded local Arabic pass also verified the contact journey’s translated headings, form prompts, CTA, and RTL form alignment. The FAQ now has Arabic page framing, six Arabic questions and answers, and an Arabic support CTA.

Production verification of release `ef4bfac` passed on `domify.ma`. The Arabic catalogue now renders translated collection headings, search summary, shared listing badges, rental and financing labels, metadata, comparison/favorite labels, and call actions against live data. The Arabic investment calculator also renders its translated controls, metrics, exploration CTA, and informational disclaimer in production.
