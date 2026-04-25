const fs = require("fs");

const content = `import React, { forwardRef } from "react";

interface InvoiceTicketProps {
  order: any;
}

export const InvoiceTicket = forwardRef<HTMLDivElement, InvoiceTicketProps>(
  ({ order }, ref) => {
    if (!order) return null;

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[210mm] mx-auto text-black font-sans print:shadow-none print:m-0 print:p-0 print:w-[210mm] print:max-w-none"
      >
        {/* ================= PAGE 1 : FACTURE ================= */}
        <div className="min-h-[297mm] flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-8">
              <div>
                <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
                  FACTURE
                </h1>
                <p className="mt-1 text-slate-500 font-mono text-sm font-semibold">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <h2 className="font-black text-2xl tracking-tighter text-primary">ChedliStore</h2>
                <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-widest">
                  Fournisseur B2B
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="mb-10 flex justify-between items-end">
              <div>
                <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-2">
                  Facturé à :
                </h3>
                <p className="font-black text-2xl text-slate-900">
                  {order.client?.company_name || "Client Inconnu"}
                </p>
                <p className="text-slate-500 font-medium">{order.client?.email}</p>
              </div>
              <div className="text-right text-sm font-medium text-slate-500 border border-slate-200 p-3 rounded-lg">
                <p>Date : {new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
                <p>Heure : {new Date(order.created_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}</p>
              </div>
            </div>

            {/* Table */}
            <div className="w-full mb-8 relative">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black text-xs uppercase tracking-widest text-slate-600">
                    <th className="pb-4 font-bold w-1/3">Description</th>
                    <th className="pb-4 font-bold">SKU</th>
                    <th className="pb-4 font-bold text-center">Qté</th>
                    <th className="pb-4 font-bold text-right">P.U</th>
                    <th className="pb-4 font-black text-right text-black">Total</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {order.order_items?.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-slate-200/60 transition-colors">
                      <td className="py-5 pr-4">
                        <p className="font-bold text-slate-900 text-base">
                          {item.product?.name || "Produit inconnu"}
                        </p>
                        {item.color_name && (
                          <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                            {item.color_name}
                          </p>
                        )}
                      </td>
                      <td className="py-5 text-slate-500 font-mono text-xs font-semibold">
                        {item.product?.sku || "-"}
                      </td>
                      <td className="py-5 text-center">
                        <span className="font-bold bg-slate-100 px-3 py-1 rounded-md">{item.quantity}</span>
                      </td>
                      <td className="py-5 text-right font-medium text-slate-600 whitespace-nowrap">
                        {item.unit_price.toFixed(2)} <span className="text-[10px] text-slate-400">DT</span>
                      </td>
                      <td className="py-5 text-right font-black text-base whitespace-nowrap">
                        {(item.quantity * item.unit_price).toFixed(2)} <span className="text-xs text-slate-400">DT</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-8">
              <div className="w-2/3 sm:w-1/2 bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-slate-500 font-medium uppercase tracking-widest text-xs">Sous-total HT</span>
                  <span className="font-mono font-bold text-slate-600">
                    {order.total_amount.toFixed(2)} DT
                  </span>
                </div>
                <div className="flex justify-between pt-4 mt-2 border-t border-slate-200/80 items-end">
                  <span className="font-black text-xl uppercase tracking-tighter">Total TTC</span>
                  <span className="font-mono text-3xl font-black text-primary tracking-tighter">
                    {order.total_amount.toFixed(2)} DT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t-2 border-dashed border-slate-200 text-center">
            <p className="font-bold text-slate-800 text-lg tracking-tight mb-1">Merci de votre confiance !</p>
            <p className="text-sm font-medium text-slate-400">
              Cette facture tient lieu de garantie (selon conditions d'achat).
            </p>
          </div>
        </div>

        {/* ================= PAGE BREAK FOR PRINTING ================= */}
        <div className="break-before-page w-full h-px mt-16 mb-16 print:block hidden border-t-4 border-black border-dashed" />

        {/* ================= PAGE 2 : BON DE LIVRAISON ================= */}
        <div className="min-h-[297mm] pt-12 print:pt-0">
          {/* Header Livraison */}
          <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
            <div className="flex flex-col gap-1">
              <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
                BON DE LIVRAISON
              </h1>
              <p className="text-slate-500 font-mono font-bold text-lg">
                CMD #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <h2 className="font-black text-2xl tracking-tighter">ChedliStore</h2>
              <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-md inline-block">
                Colis / Expédition
              </p>
            </div>
          </div>

          {/* Client Info (Shipping Dest.) */}
          <div className="mb-12 border-2 border-slate-200 bg-slate-50 p-8 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200 rounded-bl-full -mr-8 -mt-8 opacity-20"></div>
            <h3 className="font-bold text-slate-400 text-sm uppercase tracking-widest mb-3">
              Destinataire :
            </h3>
            <p className="font-black text-4xl mb-2 tracking-tighter text-slate-900">
              {order.client?.company_name || "Client Inconnu"}
            </p>
            <p className="text-slate-500 font-bold text-xl">{order.client?.email}</p>
            <div className="mt-8 pt-6 border-t-2 border-slate-200/60 flex items-center justify-between">
               <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                 Date de prép. : {new Date(order.created_at).toLocaleDateString("fr-FR")}
               </p>
               <div className="w-32 h-10 border-2 border-slate-300 rounded border-dashed flex items-center justify-center text-xs font-black text-slate-400 tracking-widest uppercase rotate-3">
                 Emballé par
               </div>
            </div>
          </div>

          {/* Packing List - NO PRICES */}
          <div className="w-full">
            <h3 className="font-black text-2xl mb-6 uppercase tracking-tighter flex items-center gap-3">
              <span className="w-2 h-8 bg-black rounded-full block"></span>
              Contenu du Colis
            </h3>
            <table className="w-full text-left border-collapse border-y-4 border-black">
              <thead>
                <tr className="border-b-2 border-black text-black">
                  <th className="py-5 font-black uppercase tracking-widest text-sm w-12 text-center text-slate-400">#</th>
                  <th className="py-5 font-black uppercase tracking-widest text-sm">Désignation</th>
                  <th className="py-5 font-black uppercase tracking-widest text-sm w-1/4">SKU / Réf</th>
                  <th className="py-5 font-black uppercase tracking-widest text-right text-lg pr-4">Qté</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-slate-200 last:border-b-0 group">
                    <td className="py-6 text-center font-bold text-slate-300 group-hover:text-black transition-colors">{i+1}</td>
                    <td className="py-6 pr-6">
                      <p className="font-black text-xl text-slate-900">
                        {item.product?.name || "Produit inconnu"}
                      </p>
                      {item.color_name && (
                        <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wide flex items-center gap-2">
                          Variante: <span className="text-black bg-slate-100 flex items-center justify-center px-2 py-1 rounded-md text-xs">{item.color_name}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-6 font-mono text-sm font-bold text-slate-500">
                      {item.product?.sku || "-"}
                    </td>
                    <td className="py-6 text-right pr-4">
                      <span className="font-black text-4xl inline-block">
                        <span className="text-lg text-slate-300 mr-1 opacity-50">x</span>{item.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest border border-slate-200 py-3 rounded-lg bg-slate-50 border-dashed">
            À coller sur le colis avant expédition
          </div>
        </div>
      </div>
    );
  },
);

InvoiceTicket.displayName = "InvoiceTicket";
`;
fs.writeFileSync("components/invoice-ticket.tsx", content);
console.log("Done replacing invoice-ticket.tsx");
