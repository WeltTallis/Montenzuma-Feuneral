<div className="content-wrapper">

                    {/* Document header. The stylesheet has carried `.doc-header`,
                        `.hdr-brand`, `.hdr-label` and `.hdr-value` (and referenced
                        them in both media queries) since this form was written, but
                        no markup ever used them — so the claim page opened straight
                        into the "Submit a Claim" intro with no title strip, no
                        provider attribution and no filling-date stamp, while the
                        sibling application form carried all three. This renders the
                        header the CSS was always written for. */}
                    <header className="doc-header">
                        <div className="hdr-brand">
                            Amani <span>Cover</span>
                        </div>
                        <div className="hdr-right">
                            <span className="hdr-label">Filling Date &amp; Time</span>
                            <span className="hdr-value">{fillStamp}</span>
                        </div>
                    </header>

                    {/* Form Intro: Submit a Claim & Checklist */}
                    <div className="form-intro">
                        {/* The claim document's own title. It was visually identical
                            in weight to the body copy below it, so it did not read as
                            a heading; now a real <h1> with the same accent treatment
                            the application form uses. */}
                        <h1 className="intro-title">Submit a <span>Claim</span></h1>
                        <p className="intro-subtitle">
                            Amani Cover Claim Application Form &mdash; Montenzuma Monalisa Funeral Home.
                            We are deeply sorry for your loss. Please complete the form below to
                            initiate the claims process. To ensure a smooth and swift review,
                            please have the following information and documents ready before you begin.
                        </p>