<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Booking writes and slot availability go through the security-definer database functions `create_appointment` and `booked_slots`, never direct table access from the client — guests must never be able to read patient rows.
- Shared booking constants (slots, services, statuses, Vietnam-time date helpers) live in `src/lib/booking.ts` so the booking page and the clinic dashboard cannot drift apart.
- The clinic dashboard lives under `src/routes/_authenticated/` and is restricted by the `doctor` role in `public.user_roles`; the first registered account is granted that role automatically.
