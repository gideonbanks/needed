import { Metadata } from "next"
import { createClient } from "lib/supabase/server"

export const metadata: Metadata = {
  title: "Supabase Connection Test",
  description: "Test page to verify Supabase connection",
}

export default async function TestSupabasePage() {
  const supabase = await createClient()
  type ServiceRow = {
    id: string
    slug: string
    name: string
    is_active: boolean
  }

  // Test 1: Check connection
  let connectionTest = { success: false, error: null as string | null }
  try {
    const { error } = await supabase.from("services").select("count").limit(1)
    connectionTest = {
      success: !error,
      error: error?.message || null,
    }
  } catch (err) {
    connectionTest = {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }

  // Test 2: Fetch services (if table exists)
  let servicesData: ServiceRow[] | null = null
  let servicesError = null
  try {
    const { data, error } = await supabase.from("services").select("*").limit(10)
    if (error) {
      servicesError = error.message
    } else {
      servicesData = data as ServiceRow[]
    }
  } catch (err) {
    servicesError = err instanceof Error ? err.message : "Unknown error"
  }

  // Test 3: Check auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "2rem" }}>🔌 Supabase Connection Test</h1>

      {/* Connection Status */}
      <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
        <h2 style={{ marginBottom: "1rem" }}>Connection Status</h2>
        {connectionTest.success ? (
          <div style={{ color: "#10b981", fontWeight: "bold" }}>
            ✅ Connected to Supabase successfully!
          </div>
        ) : (
          <div>
            <div style={{ color: "#ef4444", fontWeight: "bold", marginBottom: "0.5rem" }}>
              ❌ Connection failed
            </div>
            {connectionTest.error && (
              <div style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Error: {connectionTest.error}
              </div>
            )}
            <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#fef3c7", borderRadius: "4px" }}>
              <strong>Common issues:</strong>
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                <li>Check your <code>.env.local</code> file has correct keys</li>
                <li>Restart dev server after updating env vars: <code>pnpm dev</code></li>
                <li>Verify your Supabase project is active</li>
                <li>Check if the &quot;services&quot; table exists (run SQL schema from SUPABASE_SETUP.md)</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Services Table Test */}
      <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
        <h2 style={{ marginBottom: "1rem" }}>Services Table Test</h2>
        {servicesError ? (
          <div>
            <div style={{ color: "#ef4444", marginBottom: "0.5rem" }}>
              ❌ Error: {servicesError}
            </div>
            <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              This usually means the &quot;services&quot; table doesn&apos;t exist yet. Run the SQL schema from{" "}
              <code>SUPABASE_SETUP.md</code> in your Supabase SQL Editor.
            </div>
          </div>
        ) : servicesData ? (
          <div>
            <div style={{ color: "#10b981", marginBottom: "1rem" }}>
              ✅ Successfully fetched {servicesData.length} service(s)
            </div>
            {servicesData.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f3f4f6" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #e5e7eb" }}>ID</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #e5e7eb" }}>Slug</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #e5e7eb" }}>Name</th>
                    <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #e5e7eb" }}>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesData.map((service) => (
                    <tr key={service.id}>
                      <td style={{ padding: "0.75rem", border: "1px solid #e5e7eb", fontSize: "0.875rem" }}>
                        {service.id.substring(0, 8)}...
                      </td>
                      <td style={{ padding: "0.75rem", border: "1px solid #e5e7eb" }}>{service.slug}</td>
                      <td style={{ padding: "0.75rem", border: "1px solid #e5e7eb" }}>{service.name}</td>
                      <td style={{ padding: "0.75rem", border: "1px solid #e5e7eb" }}>
                        {service.is_active ? "✅" : "❌"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: "#6b7280" }}>Table exists but is empty. Insert some test data.</div>
            )}
          </div>
        ) : (
          <div style={{ color: "#6b7280" }}>Loading...</div>
        )}
      </section>

      {/* Auth Test */}
      <section style={{ marginBottom: "2rem", padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
        <h2 style={{ marginBottom: "1rem" }}>Authentication Test</h2>
        {authError ? (
          <div>
            <div style={{ color: "#f59e0b", marginBottom: "0.5rem" }}>
              ⚠️ Auth session missing (Expected for anonymous requests)
            </div>
            <div style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.5rem", padding: "1rem", backgroundColor: "#fef3c7", borderRadius: "4px" }}>
              <strong>This is normal!</strong> For your MVP:
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                <li>Customers remain anonymous (no auth required)</li>
                <li>Only phone verification is needed (OTP via Twilio)</li>
                <li>Providers will need authentication (for the provider app)</li>
              </ul>
              <div style={{ marginTop: "0.5rem" }}>
                The &quot;Auth session missing&quot; error is expected when no user is logged in.
              </div>
            </div>
          </div>
        ) : user ? (
          <div style={{ color: "#10b981" }}>
            ✅ User authenticated: {user.email || user.id}
          </div>
        ) : (
          <div style={{ color: "#10b981" }}>
            ✅ No user authenticated (Expected - customers are anonymous)
          </div>
        )}
      </section>

      {/* Environment Check */}
      <section style={{ padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#f9fafb" }}>
        <h2 style={{ marginBottom: "1rem" }}>Environment Variables</h2>
        <div style={{ fontSize: "0.875rem", fontFamily: "monospace" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
              <span style={{ color: "#10b981" }}>
                ✅ Set ({process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...)
              </span>
            ) : (
              <span style={{ color: "#ef4444" }}>❌ Not set</span>
            )}
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
              <span style={{ color: "#10b981" }}>
                ✅ Set ({process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...)
              </span>
            ) : (
              <span style={{ color: "#ef4444" }}>❌ Not set</span>
            )}
          </div>
          <div>
            <strong>SUPABASE_SERVICE_ROLE_KEY:</strong>{" "}
            {process.env.SUPABASE_SERVICE_ROLE_KEY ? (
              <span style={{ color: "#10b981" }}>✅ Set (hidden)</span>
            ) : (
              <span style={{ color: "#ef4444" }}>❌ Not set</span>
            )}
          </div>
        </div>
      </section>

      {/* Next Steps */}
      <section style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#dbeafe", borderRadius: "8px" }}>
        <h2 style={{ marginBottom: "1rem" }}>Next Steps</h2>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            If connection failed, check your <code>.env.local</code> file and restart the dev server
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            If services table doesn&apos;t exist, run the SQL schema from <code>SUPABASE_SETUP.md</code>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Once everything works, generate TypeScript types: <code>pnpm supabase:types</code>
          </li>
          <li>Start building your features! 🚀</li>
        </ol>
      </section>
    </div>
  )
}
