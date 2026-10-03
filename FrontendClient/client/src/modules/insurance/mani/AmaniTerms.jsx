<article className={`${CARD} mt-6`}>
            <span className={CARD_ICON}>
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-serif text-2xl text-ac-primary">Exclusions</h2>
            <p className="mt-2 leading-relaxed text-ac-mutedfg">
              Situations where a benefit is not payable under the policy.
            </p>
            <ol className="mt-6 flex flex-col gap-4">
              {exclusions.map((item, index) => (
                <li key={index} className="flex gap-4 leading-relaxed">
                  <span className="shrink-0 font-serif text-xl text-ac-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-ac-mutedfg">{item}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className={`${CARD} mt-6`}>
            <span className={CARD_ICON}>
              <Check className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-6 font-serif text-2xl text-ac-primary">
              Claims Documents Required for Benefit
            </h2>
            <p className="mt-2 leading-relaxed text-ac-mutedfg">
              What our team will ask for when a claim is made.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {claimDocuments.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-ac-bg px-4 py-3 leading-relaxed text-ac-primary"
                >
                  <Check className="mt-1 size-4 shrink-0 text-ac-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          {/* Close: the two things someone reading the fine print wants next. */}
          <div className="mt-16 flex flex-col items-center gap-5 text-center">
            <p className="font-serif text-2xl text-ac-primary">Still deciding?</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/amani/cover#apply"
                className="inline-flex h-13 items-center justify-center rounded-full bg-ac-primary px-7 text-base font-medium text-ac-onprimary transition-colors hover:bg-ac-primary/90"
              >
                Start an application
              </a>
              <a
                href={CONTACT.phoneHref}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-ac-primary/20 px-7 text-base font-medium text-ac-primary transition-colors hover:bg-ac-primary/5"
              >
                <Phone className="size-4" aria-hidden="true" /> Talk it through
              </a>
            </div>
            <Link
              to="/amani/cover/refer"
              className="mt-2 text-sm font-medium text-ac-accent underline underline-offset-4"
            >
              Or refer someone you love
            </Link>
          </div>
        </div>
      </main>

      <AmaniFooter />
    </div>
  );
}