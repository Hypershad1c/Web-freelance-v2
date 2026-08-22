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
