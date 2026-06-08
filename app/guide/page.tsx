'use client';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white text-gray-800 print:bg-white">
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .guide { max-width: 100% !important; padding: 0 !important; }
        }
        .guide h1 { color: #00A4C7; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .guide h2 { color: #1a1a2e; font-size: 20px; font-weight: 700; margin-top: 32px; margin-bottom: 12px; border-bottom: 2px solid #00A4C7; padding-bottom: 6px; }
        .guide h3 { color: #1a1a2e; font-size: 14px; font-weight: 700; margin-top: 20px; margin-bottom: 8px; }
        .guide p { font-size: 13px; line-height: 1.6; margin-bottom: 8px; color: #444; }
        .guide ul { list-style: none; padding-left: 0; margin-bottom: 12px; }
        .guide ul li { font-size: 13px; line-height: 1.6; color: #444; padding-left: 20px; position: relative; margin-bottom: 4px; }
        .guide ul li::before { content: ''; position: absolute; left: 4px; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: #00A4C7; }
        .guide ol { padding-left: 20px; margin-bottom: 12px; }
        .guide ol li { font-size: 13px; line-height: 1.6; color: #444; margin-bottom: 4px; }
        .guide ol li::marker { color: #00A4C7; font-weight: 700; }
        .guide table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        .guide th { background: #00A4C7; color: white; padding: 8px 12px; text-align: left; font-weight: 600; }
        .guide td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
        .guide tr:nth-child(even) td { background: #f9fafb; }
        .guide .bold-row td { font-weight: 700; background: #e0f4f9; }
        .guide strong { color: #1a1a2e; }
        .guide code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 12px; color: #00A4C7; }
        .guide hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
        .guide .callout { background: #f0f9fc; border-left: 4px solid #00A4C7; padding: 12px 16px; margin: 12px 0; font-size: 13px; color: #333; }
      `}</style>

      {/* Print button */}
      <div className="no-print bg-gray-100 p-4 text-center border-b">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-[#00A4C7] text-white rounded font-medium hover:bg-[#0090b0] transition-colors"
        >
          Print / Save as PDF
        </button>
        <span className="ml-4 text-gray-500 text-sm">Click the button or use Cmd+P / Ctrl+P</span>
      </div>

      <div className="guide max-w-3xl mx-auto px-12 py-10">
        <h1>Rolling Suds — Starbucks Operations Platform</h1>
        <p>A free web app that automates the paperwork for your Starbucks overnight pressure washing contract through GoSuperClean. Every Rolling Suds franchisee doing Starbucks work can use this.</p>

        <h2>Full Functionality</h2>

        <h3>1. Upload Your Starbucks Schedule</h3>
        <ul>
          <li>Drag and drop your monthly .xlsx schedule spreadsheet</li>
          <li>The app parses every store: night number, date, store number, address, city, state</li>
          <li>Set the price for all stores at once (type a price and click &quot;Set All&quot;)</li>
          <li>Assign a default technician to all jobs, or assign per-store</li>
          <li>Click &quot;Save Locally&quot; — all jobs are saved and appear on your calendar</li>
        </ul>

        <h3>2. Calendar / Schedule View</h3>
        <ul>
          <li>See all your Starbucks jobs in a week or month calendar view</li>
          <li>Color coded: <strong className="text-red-500">red</strong> = unassigned, <strong className="text-blue-500">blue</strong> = assigned, <strong className="text-green-500">green</strong> = completed</li>
          <li>Click any job to open its detail page</li>
          <li>Bulk assign a technician to multiple jobs at once (Shift+Click to select)</li>
        </ul>

        <h3>3. Job Detail Page (where the magic happens)</h3>
        <p>After a job is completed, open it and fill in the <strong>WO#</strong> (work order number from GoSuperClean), <strong>Invoice#</strong> (your sequential invoice number), <strong>start/stop times</strong>, and mark as <strong>completed</strong>. Everything auto-saves as you type.</p>

        <h3>4. PDF Generation</h3>
        <ul>
          <li><strong>Invoice PDF</strong> — Rolling Suds branded with your company name, phone, email, description table, price, Balance Due</li>
          <li><strong>Work Order PDF</strong> — SuperClean Service Company format with service date, store info, instruction paragraph, photo warning, technician checklist (all boxes checked), completion section with tech name/start/stop/total hours, and signature</li>
          <li>Preview each PDF in the browser before downloading</li>
          <li>Download individually or both at once</li>
        </ul>

        <h3>5. CompanyCam Integration</h3>
        <ul>
        <li>Click &quot;Find Photos&quot; on any job</li>
        <li>Auto-searches CompanyCam for a project matching &quot;Starbucks #XXXXX WO# XXXXXXX&quot;</li>
        <li>If found, automatically loads and selects all photos</li>
        <li>You see thumbnails and confirm they&apos;re correct before sending</li>
        <li>If the exact name doesn&apos;t match, shows similar projects so you can pick the right one</li>
        <li><strong>2026 requirement:</strong> minimum 12 before/after photos covering 6 areas (front door entry, sidewalk, patio, drive-thru pick-up window, between ordering &amp; pick-up area, drive-thru ordering area) + 1 storefront overview showing the door number</li>
        <li>The app shows a warning if fewer than 12 photos are selected</li>
        </ul>

        <h3>6. Email Sending</h3>
        <p>Two separate emails per store, each with one click:</p>

        <p><strong>&quot;Send Documents&quot; → documents@gosuperclean.com</strong></p>
        <ul>
          <li>Auto-generates the Invoice PDF and signed Work Order PDF on the server</li>
          <li>Attaches both as proper PDF file attachments</li>
          <li>Subject: <code>Starbucks #00806 WO# 1963606 Invoice</code></li>
          <li>Body: &quot;Attached is the invoice and signed WO for Starbucks #00806 WO# 1963606. Let me know if you have any questions. Thanks.&quot;</li>
          <li>You are CC&apos;d on every email</li>
        </ul>

        <p><strong>&quot;Send Photos&quot; → starbucks@gosuperclean.com</strong></p>
        <ul>
          <li>Downloads the selected CompanyCam photos on the server</li>
          <li>Attaches all as proper JPEG file attachments</li>
          <li>Subject: <code>Starbucks #00806 WO# 1963606 Pictures</code></li>
          <li>Body: &quot;Attached are the before/after pictures and front door photo for Starbucks #00806 WO# 1963606. Let me know if you have any questions. Thanks.&quot;</li>
          <li>You are CC&apos;d on every email</li>
        </ul>

        <div className="callout">
          <strong>&quot;Test to Me&quot; button</strong> — sends to your own email first so you can verify everything looks right before sending to GoSuperClean.
        </div>

        <h3>7. Email Logging</h3>
        <ul>
          <li>Every email sent is recorded on the job: type (docs/photos), recipient, timestamp</li>
          <li>Shows a green &quot;Sent&quot; badge so you know what&apos;s been sent</li>
          <li>Button changes to &quot;Resend&quot; after first send to prevent accidental double-sends</li>
          <li>Full audit trail of every email per store</li>
        </ul>

        <h3>8. Settings</h3>
        <ul>
          <li>Add and remove technicians from the app (no code changes needed)</li>
          <li>Technician list is shared across all pages</li>
        </ul>

        <h3>9. Standalone Doc Generator</h3>
        <ul>
          <li>The /generate page works independently of everything else</li>
          <li>Type in store info manually and generate Invoice + Work Order PDFs</li>
          <li>Useful as a fallback if you just need quick PDFs without the full workflow</li>
        </ul>

        <hr />

        <h2>Cost</h2>
        <table>
          <thead><tr><th>Service</th><th>Cost</th></tr></thead>
          <tbody>
            <tr><td>Hosting (Vercel)</td><td>Free</td></tr>
            <tr><td>Database (Redis)</td><td>Free (30MB)</td></tr>
            <tr><td>Email (Resend)</td><td>Free (3,000 emails/month)</td></tr>
            <tr><td>CompanyCam</td><td>You already have this</td></tr>
            <tr className="bold-row"><td>Total</td><td>$0/month</td></tr>
          </tbody>
        </table>

        <hr />

        <h2>Setup Instructions (~30 minutes)</h2>

        <h3>Step 1: Create Free Accounts</h3>
        <ol>
          <li><strong>GitHub</strong> — go to github.com and sign up</li>
          <li><strong>Vercel</strong> — go to vercel.com and sign in with your GitHub account</li>
          <li><strong>Resend</strong> — go to resend.com and sign up (for sending emails)</li>
        </ol>

        <h3>Step 2: Fork the Repository</h3>
        <ol>
          <li>Go to: <strong>github.com/maxgelfman-glitch/Starbucks</strong></li>
          <li>Click the <strong>&quot;Fork&quot;</strong> button (top right of the page)</li>
          <li>Click <strong>&quot;Create fork&quot;</strong></li>
          <li>You now have your own copy. Your data is completely separate from everyone else&apos;s.</li>
        </ol>

        <h3>Step 3: Get Your CompanyCam API Token</h3>
        <ol>
          <li>Log into CompanyCam</li>
          <li>Go to <strong>Your Company → Account → Access Tokens</strong></li>
          <li>Click <strong>Create an Access Token</strong></li>
          <li>Select <strong>&quot;N/A&quot;</strong> from the dropdown</li>
          <li>Copy the token and save it — you&apos;ll need it in Step 5</li>
        </ol>

        <h3>Step 4: Set Up Resend (for email)</h3>
        <ol>
          <li>Go to <strong>resend.com</strong> and sign in</li>
          <li>Go to <strong>API Keys</strong> and copy your API key</li>
          <li>Go to <strong>Domains → Add Domain</strong></li>
          <li>Type in a domain you own (e.g. yourbusiness.com)</li>
          <li>Resend will show you <strong>3 DNS records</strong> to add</li>
          <li>Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add those DNS records</li>
          <li>Go back to Resend and click <strong>Verify</strong></li>
        </ol>
        <div className="callout">
          <strong>You MUST verify a domain to send emails to external addresses.</strong> There is no way around this — every email service requires it.
        </div>

        <h3>Step 5: Deploy to Vercel</h3>
        <ol>
          <li>Go to <strong>vercel.com</strong></li>
          <li>Click <strong>&quot;Add New...&quot; → &quot;Project&quot;</strong></li>
          <li>Find your forked <strong>Starbucks</strong> repo and click <strong>Import</strong></li>
          <li><strong>Before clicking Deploy</strong>, expand <strong>&quot;Environment Variables&quot;</strong></li>
          <li>Add each variable from the table below, then click <strong>Deploy</strong></li>
        </ol>

        <table>
          <thead><tr><th>Variable Name</th><th>Your Value</th></tr></thead>
          <tbody>
            <tr><td><code>RESEND_API_KEY</code></td><td>Your Resend API key</td></tr>
            <tr><td><code>EMAIL_FROM</code></td><td>yourname@yourdomain.com (must match verified Resend domain)</td></tr>
            <tr><td><code>EMAIL_SENDER_NAME</code></td><td>Your Name</td></tr>
            <tr><td><code>EMAIL_REPLY_TO</code></td><td>your.email@rollingsuds.com</td></tr>
            <tr><td><code>EMAIL_CC</code></td><td>your.email@rollingsuds.com</td></tr>
            <tr><td><code>COMPANYCAM_API_TOKEN</code></td><td>Your CompanyCam token from Step 3</td></tr>
            <tr><td><code>NEXT_PUBLIC_COMPANY_NAME</code></td><td>Rolling Suds of [Your Territory]</td></tr>
            <tr><td><code>NEXT_PUBLIC_COMPANY_PHONE</code></td><td>(555) 123-4567</td></tr>
            <tr><td><code>NEXT_PUBLIC_COMPANY_EMAIL</code></td><td>your.email@rollingsuds.com</td></tr>
          </tbody>
        </table>

        <h3>Step 6: Add Database</h3>
        <ol>
          <li>In Vercel, go to your <strong>starbucks project</strong></li>
          <li>Click the <strong>&quot;Storage&quot;</strong> tab</li>
          <li>Click <strong>&quot;Create Database&quot;</strong> → choose <strong>&quot;KV&quot; (Redis)</strong></li>
          <li>Select the <strong>free 30MB plan</strong></li>
          <li>Connect it to your project</li>
          <li>Go to <strong>Deployments</strong> tab → click three dots on latest deploy → <strong>Redeploy</strong></li>
        </ol>

        <h3>Step 7: Test Everything</h3>
        <ol>
          <li>Go to your app URL and add <code>/api/seed</code> to load test data</li>
          <li>Go to <strong>Generate Docs</strong> — create a test invoice and work order</li>
          <li>Go to <strong>Schedule</strong> — verify jobs appear on the calendar</li>
          <li>Click into a job — fill in WO#, click <strong>Find Photos</strong></li>
          <li>Click <strong>&quot;Test to Me&quot;</strong> for documents — check your email</li>
          <li>Click <strong>&quot;Test to Me&quot;</strong> for photos — check your email</li>
          <li>If everything looks good, you&apos;re ready to use it for real</li>
        </ol>

        <hr />

        <h2>Spreadsheet Format</h2>
        <p>Your Starbucks schedule .xlsx must have these columns:</p>
        <table>
          <thead><tr><th>Night</th><th>Date</th><th>Store</th><th>Address</th><th>City</th><th>State</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>2026-04-06</td><td>Starbucks # 00806</td><td>301 Greenwich Ave</td><td>Greenwich</td><td>CT</td></tr>
          </tbody>
        </table>

        <hr />

        <h2>Daily Workflow</h2>
        <ol>
          <li>Jobs get done overnight</li>
          <li>Next morning, open the app on your phone</li>
          <li>Go to <strong>Schedule</strong>, click the completed job</li>
          <li>Fill in: <strong>WO#</strong>, <strong>Invoice#</strong>, <strong>start/stop times</strong></li>
          <li>Change status to <strong>completed</strong></li>
          <li>Click <strong>&quot;Find Photos&quot;</strong> (auto-matches from CompanyCam)</li>
          <li>Verify photos look right</li>
          <li>Click <strong>&quot;Send Documents&quot;</strong> — invoice + signed WO → documents@gosuperclean.com</li>
          <li>Click <strong>&quot;Send Photos&quot;</strong> — 5 photos → starbucks@gosuperclean.com</li>
          <li>Green &quot;Sent&quot; badge confirms it&apos;s done. Move to next store.</li>
        </ol>

        <hr />

        <h2>Important Notes</h2>
        <ul>
          <li><strong>Each franchisee runs their own instance.</strong> Your data, API keys, and emails are 100% separate from everyone else&apos;s. There is no shared anything.</li>
          <li><strong>If you fork without setting environment variables</strong>, the app shows generic placeholders and emails won&apos;t work. You MUST set up your own env vars.</li>
          <li><strong>CompanyCam project naming matters.</strong> Projects should be named like <code>Starbucks #00806 WO# 1963606</code> for the auto-match to work.</li>
          <li><strong>The app works without Workiz.</strong> Workiz integration is optional. Everything else works independently.</li>
          <li><strong>Bookmark your Vercel URL.</strong> That&apos;s your app. It works on desktop and mobile.</li>
        </ul>

        <hr />
        <p className="text-center text-gray-400 text-xs mt-8">
          Questions? Reach out to Max Gelfman at Rolling Suds of Westchester-Stamford.
        </p>
      </div>
    </div>
  );
}
