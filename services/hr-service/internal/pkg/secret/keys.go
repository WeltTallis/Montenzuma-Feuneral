package secret

// LegacyMessagingCredentialsKey keeps the retired provider credential row
// encrypted so existing deployments do not expose stored secrets.
const LegacyMessagingCredentialsKey = "zalo.credentials"

// ProtectedKeys is the complete set of settings keys whose values are sealed at
// rest. Deliberately an allow-list, not a heuristic: sealing a value that an
// operator needs to read by hand (or a key nobody ever rotates) buys nothing,
// and a wrong guess breaks the feature the setting drives.
//
// Adding a key here is safe — plaintext values stay readable and the startup
// backfill converts them — but any code that compares stored values literally
// (settings CompareAndSwapValue) must go through the repository, never raw SQL.
var ProtectedKeys = []string{
	LegacyMessagingCredentialsKey,
}

// IsProtectedKey reports whether a settings key holds a sealed value.
func IsProtectedKey(key string) bool {
	for _, protected := range ProtectedKeys {
		if key == protected {
			return true
		}
	}
	return false
}
