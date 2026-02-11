"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotePdfService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
class QuotePdfService {
    static generate(quote, res) {
        var _a, _b, _c, _d, _e, _f, _g;
        const doc = new pdfkit_1.default({ margin: 50 });
        // Pipe to response
        doc.pipe(res);
        // -- Header --
        const orgName = ((_a = quote.organisation) === null || _a === void 0 ? void 0 : _a.name) || 'My Organisation';
        doc.fontSize(20).text(orgName, 50, 50);
        doc.fontSize(10).text(((_b = quote.organisation) === null || _b === void 0 ? void 0 : _b.address) || '', 50, 80);
        doc.text(((_c = quote.organisation) === null || _c === void 0 ? void 0 : _c.contactEmail) || '', 50, 95);
        doc.text(((_d = quote.organisation) === null || _d === void 0 ? void 0 : _d.contactPhone) || '', 50, 110);
        // -- Title --
        doc.fontSize(24).text('QUOTE', 400, 50, { align: 'right' });
        doc.fontSize(10).text(`Quote #: ${quote.quoteNumber}`, 400, 80, { align: 'right' });
        doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 400, 95, { align: 'right' });
        doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, 400, 110, { align: 'right' });
        doc.moveDown(2);
        // -- Bill To --
        doc.fontSize(12).text('Bill To:', 50);
        doc.fontSize(10);
        if (quote.account) {
            doc.text(quote.account.name);
            if (quote.account.address) {
                const addr = quote.account.address;
                const formatted = typeof addr === 'string'
                    ? addr
                    : [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(', ');
                doc.text(formatted);
            }
        }
        else if (quote.contact) {
            doc.text(`${quote.contact.firstName} ${quote.contact.lastName}`);
            doc.text(quote.contact.email || '');
        }
        doc.moveDown(2);
        // -- Line Items Table --
        const tableTop = doc.y;
        const itemCodeX = 50;
        const descriptionX = 100;
        const quantityX = 300;
        const priceX = 350;
        const totalX = 450;
        // Table Header
        doc.font('Helvetica-Bold');
        doc.text('Item', itemCodeX, tableTop);
        doc.text('Description', descriptionX, tableTop);
        doc.text('Qty', quantityX, tableTop);
        doc.text('Price', priceX, tableTop);
        doc.text('Total', totalX, tableTop);
        doc.moveDown(0.5);
        // Draw Header Line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        // Table Rows
        doc.font('Helvetica');
        let currentY = doc.y;
        (quote.lineItems || []).forEach((item) => {
            const productName = item.productName || 'Item';
            const desc = item.description || '';
            const qty = item.quantity || 0;
            const price = item.unitPrice || 0;
            const total = item.total || 0;
            doc.text(productName, itemCodeX, currentY);
            doc.text(desc, descriptionX, currentY);
            doc.text(qty.toString(), quantityX, currentY);
            doc.text(price.toFixed(2), priceX, currentY);
            doc.text(total.toFixed(2), totalX, currentY);
            currentY += 20;
        });
        // Draw Footer Line
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
        currentY += 10;
        // -- Totals --
        doc.text(`Subtotal: ${((_e = quote.subtotal) === null || _e === void 0 ? void 0 : _e.toFixed(2)) || '0.00'}`, 400, currentY, { align: 'right' });
        currentY += 15;
        doc.text(`Tax: ${((_f = quote.totalTax) === null || _f === void 0 ? void 0 : _f.toFixed(2)) || '0.00'}`, 400, currentY, { align: 'right' });
        currentY += 15;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(`Total: ${((_g = quote.grandTotal) === null || _g === void 0 ? void 0 : _g.toFixed(2)) || '0.00'} ${quote.currency || 'INR'}`, 400, currentY, { align: 'right' });
        // -- Footer --
        doc.text(quote.termsAndConditions || '', 50, 700);
        doc.end();
    }
}
exports.QuotePdfService = QuotePdfService;
