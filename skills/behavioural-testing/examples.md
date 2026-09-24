# Good and bad tests

The examples are in Rust, from a console-access tool. The shape is the same in any language.

## Through the use case, with fakes

Good. It drives the use case, fakes the ports, and checks what the caller sees:

```rust
// SCN-access.second-hop-refused
#[test]
fn second_hop_refused_closes_the_first_hop() {
    let catalog = InMemoryDeviceCatalog::with(device("lab-router", ssh_via("jump-1")));
    let connector = FakeHopConnector::new();
    connector.refuse("lab-router");
    let open = OpenConsole::new(&catalog, &connector);

    let result = open.run("lab-router");

    assert_eq!(result.unwrap_err(), OpenConsoleError::HopRefused { hop: 2 });
    assert_eq!(connector.open_hops(), Vec::<String>::new());
}
```

Bad. It mocks an internal collaborator and asserts on calls, so it breaks on refactors that keep the behaviour:

```rust
#[test]
fn open_console_calls_resolver_then_connector() {
    let mut resolver = MockPathResolver::new();
    resolver.expect_resolve().times(1).returning(|_| Ok(path()));
    // ...asserts that resolve() ran before connect()
}
```

## Expected values from the spec

Good. The expected value is the literal from the scenario:

```rust
// SCN-inventory.list-configured
#[test]
fn lists_devices_in_name_order() {
    let catalog = InMemoryDeviceCatalog::with_names(&["lab-router", "core-switch"]);
    assert_eq!(ListDevices::new(&catalog).run(), vec!["core-switch", "lab-router"]);
}
```

Bad. It recomputes the expectation the way the code does, so it can never disagree with the code:

```rust
#[test]
fn lists_devices_sorted() {
    let names = vec!["lab-router", "core-switch"];
    let mut expected = names.clone();
    expected.sort();
    assert_eq!(ListDevices::new(&catalog_of(&names)).run(), expected);
}
```

## Reading back through the interface

Good. It checks the effect through the port's own operation:

```rust
// SCN-inventory.add-device
#[test]
fn added_device_is_listed() {
    let catalog = InMemoryDeviceCatalog::empty();
    AddDevice::new(&catalog).run(new_device("lab-router")).unwrap();
    assert_eq!(ListDevices::new(&catalog).run(), vec!["lab-router"]);
}
```

Bad. It bypasses the interface to inspect storage:

```rust
#[test]
fn add_device_writes_the_toml_file() {
    AddDevice::new(&TomlCatalog::at(&path)).run(new_device("lab-router")).unwrap();
    assert!(std::fs::read_to_string(&path).unwrap().contains("[lab-router]"));
}
```

The file format is the TOML adapter's business. Its contract tests cover it, and they read back through `DeviceCatalog`.

## A domain test that earns its place

Good. A state machine with real rules, tested through the entity's own API:

```rust
// ENT-access.console-session
#[test]
fn a_closed_session_cannot_reopen() {
    let mut session = ConsoleSession::opening();
    session.opened().unwrap();
    session.close();
    assert_eq!(session.opened(), Err(SessionError::AlreadyClosed));
}
```

Not worth writing: a test that `Device::name()` returns the name it was built with.
