import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/marketing";

export function Faq() {
  return (
    <section className="border-t">
      <div className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[26rem_1fr] lg:items-start">
          <div>
            <p className="field-label">Questions</p>
            <h2 className="display mt-4 text-[clamp(2rem,1.4rem+2.4vw,3.25rem)]">
              Asked on the phone
            </h2>
          </div>

          <Accordion type="single" collapsible className="border-t">
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="py-5 text-left text-lg">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-[68ch] pb-6 text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
