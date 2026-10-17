# Breaking the release into features

A feature is a slice the user can see working: a command that answers, a screen that shows something, a device that changes state. The release's features, built in order, deliver what the vision promises.

1. **Choose the foundation.** The first feature is the one everything else builds on and the user tries first. Pick the kind that fits, and say why when you show the breakdown:
   - **Walking skeleton:** one real use case through every layer, from the inbound adapter to a driven adapter. It suits most systems.
   - **Core component:** the component the others depend on, working for real through its own interface, such as a server with its command-line client. It suits a system of several components.
   - **Product shell:** every screen or command the release offers, wired together over sample data. It suits settling look and flows before logic.
2. **List the slices.** Walk the vision's promise from the user's side and cut it where the user could stop and try something. Name each feature with a slug the user would recognise, such as `sign-in` or `export-csv`.
3. **Size each one** for one shape and one build: about 3 to 10 scenarios, the user's words for its behaviour fitting on a page. Split a bigger one along what the user can try first. Merge one that the user couldn't try without another.
4. **Name what each needs.** A feature needs another when it can't be built or tried without it. Ordering for convenience isn't a need.
5. **Order for the product, not the platform.** Put the features that prove the product's core purpose as early as their needs allow. Shared machinery, such as a plugin system, a scheduler or a generic store, goes in no feature of its own: it arrives inside the second feature that needs it. One project built six days of infrastructure and no product, and was restarted.

Done when every promise of the release is in some feature, and the Release table lists them in build order with their needs.
