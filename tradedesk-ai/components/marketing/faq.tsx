import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/marketing";

export function Faq() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 md:py-24">
      <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:items-start">
        <div>
          <p className="kicker text-muted-foreground">Questions</p>
          <h2 className="display mt-3 text-4xl sm:text-5xl">
            Asked on the phone
          </h2>
        </div>

        <Accordion
          type="single"
          collapsible
          className="border-t border-white/10"
        >
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="border-white/10"
            >
              <AccordionTrigger className="py-5 text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
