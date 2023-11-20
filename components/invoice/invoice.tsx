//import './invoice.css';

import React from "react";
import { convertToCurrency } from "../../helper/architecture";


const Invoice = (props: { company, order, user }, ref) => {

    const calculateNetto = (tokenstobuy: number) => {
        return (tokenstobuy * (0.00003 * getFac(tokenstobuy)));
    }

    const getFac = (tokens: number) => {
        let tokenstobuy = tokens/10000;

        if(tokenstobuy >= 100 && tokenstobuy < 250){
            return 4.5;
        }
        
        if(tokenstobuy >= 250 && tokenstobuy < 500){
            return 4;
        }

        if(tokenstobuy >= 500 && tokenstobuy < 1000){
            return 3.5;
        }

        if(tokenstobuy >= 1000){
            return 3;
        }

        return 5;
    }
  
    
    return (
        <div className="invoice-box" ref={ref}>
			<table cellPadding="0" cellSpacing="0">
				<tr className="top">
					<td colSpan={2}>
						<table>
							<tr>
								<td className="title">
									<img
										src="/full_logo.png"
										style={{width: "100%", maxWidth: "150px"}}
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
                                <td><div className="companyinfo">Siteware GmbH | Am Weilsberg 11 | 51789 Lindlar</div></td>
                            </tr>
							<tr className="customerheader">
								<td>
                                    {props.company.name}<br />
                                    {props.user.firstname} {props.user.lastname}<br />
                                    {props.company.street}<br />
                                    {props.company.postalcode} {props.company.city}<br />
								</td>
							</tr>
                            <tr className="orderdetails" >
                                <td></td>
                                <td style={{ textAlign: "right" }}>
                                    Kundennummer: {123124214124}<br />
                                    Auftragsdatum: {new Date(props.order.timestamp * 1000).toLocaleString('de',{timeZone:'Europe/Berlin', dateStyle: "short"})}
                                </td>
                            </tr>

                            <tr></tr>
						</table>
					</td>
				</tr>
			</table>

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
                        <td>swmp01</td>
                        <td className="itemname">Mailbuddy Token</td>
                        <td>{props.order.tokens}</td>
                        <td>19%</td>
                        <td>{parseFloat((0.00003 * getFac(props.order.tokens)).toFixed(5))} €</td>
                        <td>{convertToCurrency(props.order.amount)}</td>
                    </tr>
                </tbody>
            </table>

            <table className="totaltable">
                <tr>
                    <td></td>
                    <td className="totalcell">
                        <div className="totalrow">
                            <div>Gesamt netto:</div>
                            <div>{convertToCurrency(calculateNetto(props.order.tokens))}</div>
                        </div>
                        <div className="totalrow steuerrow">
                            <div>zzgl. MwSt. 19.00 %</div>
                            <div>{convertToCurrency(calculateNetto(props.order.tokens) * 0.19)}</div>
                        </div>
                        <div className="totalrow final">
                            <div>Gesamt</div>
                            <div>{convertToCurrency(calculateNetto(props.order.tokens) * 1.19)}</div>
                        </div>
                    </td>
                </tr>
            </table>

            <div className="invoicespacer">
                
            </div>

            <div className="invoiceFooter">
                    <div className="invoiceFooterCol">
                        <div>Sitz der Gesellschaft</div>
                        <div>Siteware GmbH</div>
                        <div>Am Weilsberg 11</div>
                        <div>D-51789 Lindlar</div>
                        <div>Tel.: +49 2266 9484340</div>
                    </div>
                    <div className="invoiceFooterCol">
                        <div>Bankverbindung</div>
                        <div>Kreissparkasse XXXX</div>
                        <div>Konto XXXXXXXXX</div>
                        <div>BLZ XXXXXXXXX</div>
                    </div>
                    <div className="invoiceFooterCol">
                        <div>IBAN XXXXXXXXXXXXXXXXXXXXXX</div>
                        <div>BIC/SWIFT XXXXXXXXXXX</div>
                        <div>Ust-IDNr. XXXXXXXXXXX</div>
                        <div>E-Mail: info@mailbuddy.siteware.io</div>
                        <div>Internet: https://mailbuddy.siteware.io</div>
                    </div>
                    <div className="invoiceFooterCol">
                        <div>Geschäftsführer</div>
                        <div>Max Mustermann</div>
                        <div>HRB XXXXXX</div>
                        <div>Amtsgericht: Musterstadt</div>
                    </div>
                </div>
		</div>
    );
  };
  export default React.forwardRef(Invoice);;