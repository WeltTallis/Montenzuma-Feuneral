export default function AmaniPayments() {
  const [policy, setPolicy] = useState(null);

  return (
    <div className="amani-cover">
      <AmaniNav active="/amani/payments" />

      <PageHeader
        eyebrow="Already covered?"
        title="Make a"
        accent="payment."
        intro="Keeping your Amani Cover up to date is simple. Check your policy below and we will show you how to contribute — or if you are unsure, call us and we will walk you through it."
      />

      <main className="px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-5xl">
          {/* Lookup first; the payment step only exists once cover is found. */}
          {policy ? (
            <PaymentPanel policy={policy} onReset={() => setPolicy(null)} />
          ) : (
            <CoverLookup onFound={setPolicy} />
          )}

          <section className="mt-10 rounded-[2rem] bg-ac-primary p-8 text-ac-onprimary sm:p-10">