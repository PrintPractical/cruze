# Glossary

The shared language of Console Access. Terms are grouped by bounded context, alphabetically within each group. Add a term the moment it settles.

## Inventory

**Console path**: The ordered hops that reach one device's console, starting from the user's machine.
_Avoid_: route, connection string

**Device**: A machine with a console that the tool can reach, identified by a unique name.
_Avoid_: host, box, target

**Hop**: One link in a console path: an SSH connection to a host, or a serial line.
_Avoid_: jump, leg, step

**Inventory**: The set of configured devices, loaded from the configuration file.
_Avoid_: catalog, device list

**Jump host**: A host reached by an SSH hop that is not the last hop of a console path.
_Avoid_: bastion, proxy

## Access

**Console session**: One open connection to a device's console, from opening the first hop to closing the last.
_Avoid_: connection, attach

**Detach**: Ending a console session from the keyboard with the escape sequence, which closes every hop and restores the terminal.
_Avoid_: disconnect, quit

**Escape sequence**: The keys that detach instead of being sent to the device: `Ctrl-]` followed by `q`.
_Avoid_: hotkey

**Link**: An open byte stream produced by connecting one hop, possibly running over the link before it.
_Avoid_: channel, pipe, stream
