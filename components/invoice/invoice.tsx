import React from "react";
import { convertToCurrency } from "../../helper/architecture";
import { Order } from "../../firebase/types/Company";

const Invoice = ( props: { company, order: Order, user }, ref ) => {
  return (
    <div className="invoice-box" ref={ref}>
      <table cellPadding="0" cellSpacing="0">
        <tr className="top">
          <td colSpan={2}>
            <table>
              <tr>
                <td className="title" style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                  <img
                    src="/sp_logo.png"
                    style={{ width: "100%", maxWidth: "200px", marginBottom: 25 }}
                  />
                </td>								
              </tr>
            </table>
          </td>
        </tr>

        <tr className="information">
          <td colSpan={2}>
            <table>
              <tr className="companyheader">
                <td><div className="companyinfo">Sugarpool GmbH | Am Weilsberg 11 | 51789 Lindlar</div></td>
              </tr>
              <tr className="customerheader">
                <td>
                  {props.company.name}<br />
                  {( props.user.role == "Singleuser" )? <>`${props.user.firstname} ${props.user.lastname}`<br /></>: ""}
                  {props.company.street}<br />
                  {props.company.postalcode} {props.company.city}<br />
                </td>
              </tr>
              <tr className="invoiceEmptyRow"></tr>
              <tr className="orderdetails" >
                <td>
                  <div className="invoicetopic">Rechnung</div>
                  <table style={{ display: "block" }}>
                    <tbody>
                      <tr className="invoiceDataRow">
                        <td><b>Datum:</b></td>
                        <td>{new Date( props.order.timestamp * 1000 ).toLocaleString( "de",{ timeZone:"Europe/Berlin", dateStyle: "short" } )}</td>
                      </tr>
                      <tr className="invoiceDataRow">
                        <td><b>Rechnungs-Nr:</b></td>
                        <td>{props.order.invoiceId}</td>
                      </tr>
                      <tr className="invoiceDataRow">
                        <td><b>Kunden-Nr:</b></td>
                        <td>{props.user.id}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div className="invoicedescription">Kauf E-Mails für Software Siteware.Mail</div>

      <table className="postable">
        <tbody>
          <tr className="heading">
            <td>Pos</td>
            <td>Artikelnr</td>
            <td>Artikel</td>
            <td>Menge</td>
            <td>MwSt.</td>
            <td>Einzelpreis(€)</td>
            <td>Gesamt(€)</td>
          </tr>

          <tr className="item">
            <td>1</td>
            <td>swm0001</td>
            <td className="itemname">Siteware.Mail Token</td>
            <td>{props.order.tokens}</td>
            <td>19%</td>
            <td>{convertToCurrency( props.order.amount / ( 1 + 0.19 ) )}</td>
            <td>{convertToCurrency( props.order.amount )}</td>
          </tr>
        </tbody>
      </table>

      <table className="totaltable">
        <tr>
          <td></td>
          <td className="totalcell">
            <div className="totalrow">
              <div>Gesamt netto:</div>
              <div>{convertToCurrency( props.order.amount / ( 1 + 0.19 ) )}</div>
            </div>
            <div className="totalrow steuerrow">
              <div>zzgl. MwSt. 19.00 %</div>
              <div>{convertToCurrency( props.order.amount )}</div>
            </div>
            <div className="totalrow final">
              <div>Gesamt</div>
              <div>{convertToCurrency( props.order.amount )}</div>
            </div>
          </td>
        </tr>
      </table>

      <div className="invoicespacer">
                
      </div>

      <div className="invoiceFooter">
        <div className="invoiceFooterCol">
          <div>Verwaltung</div>
          <div>Sugarpool GmbH</div>
          <div>Am Weilsberg 11</div>
          <div>51789 Lindlar</div>
        </div>
        <div className="invoiceFooterCol">
          <div>Telefon: +49 22 66 - 90 41 77-0</div>
          <div>Telefax: +49 22 66 - 90 41 77-9</div>
          <div>E-Mail: info@sugarpool.de</div>
          <div>www.sugarpool.de</div>
        </div>
        <div className="invoiceFooterCol">
          <div>Geschäftsführer:</div>
          <div>Petra Jansen,</div>
          <div>Andreas Jansen</div>
          <div>Amtsgericht Köln: HRB 72710</div>
        </div>
        <div className="invoiceFooterCol">
          <div>Commerzbank Overath:</div>
          <div>DE52370400440827031600</div>
          <div>BIC/SWIFT: COBADEFFXXX</div>
          <div>USt-IdNr.: DE-271536541</div>
        </div>
      </div>
    </div>
  );
};
export default React.forwardRef( Invoice );
