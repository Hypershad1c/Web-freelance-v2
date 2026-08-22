# Arabic buyer-page RTL audit — 22 August 2026

The Arabic header, footer navigation, and locale switcher load correctly. The property-detail content still mixes French labels, left-to-right breadcrumb order, and unmirrored action/card alignment despite Arabic navigation. The financing calculator uses French-only buyer labels and left-to-right arrows.

The correction scope is therefore limited to the highest-traffic buyer routes: property details and the bank-branded financing calculator. It will apply Arabic labels, `dir="rtl"`, right-aligned hierarchy, mirrored reading order, and directional icon treatment while retaining numbers, prices, bank names, and email/phone values in their appropriate display direction.

Local verification confirmed that the updated calculator route loads in French with its complete branded bank-selection grid. The next review switches the local locale cookie to Arabic to validate the mirrored experience before release.

Arabic local verification passed for the calculator. The bank-selection cards render right-to-left with Arabic labels, while Latin bank names and MAD figures retain readable isolation. The simulation mirrors the desktop panels, reverses directional arrows, and localizes sliders, rate disclosures, the buyer-only enquiry section, select options, form placeholders, and the no-offer disclaimer.

The local property-details route cannot load data because this workspace intentionally has no development database credentials. Its TypeScript and production build validation passed; live production verification will follow deployment, where the route can query the configured database.
