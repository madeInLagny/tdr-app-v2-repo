This site holds the source code of the tradedutyrefund.com, fr.tradedutyrefund.com and it.tradedutyrefund.com sites.

## GA4 conversion tracking

The shared tracking script sends `cta_click`, `generate_lead` (contact form), and
`appointment_booked` (confirmed appointment) events. Each includes the `source_page`
path. Contact conversions are sent from `contact-confirmation.html`.

In Zcal, set the successful-booking redirect URL to
`https://tradedutyrefund.com/make-an-appointment-confirmation.html` so the
appointment conversion fires only after a booking is confirmed. Register
`source_page` as an event-scoped custom dimension in GA4 to report conversions
by their originating page, and mark `generate_lead` and `appointment_booked`
as key events in GA4.
