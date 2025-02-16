# Risk Scoring Prompt

## Overview

The Risk Scoring system is a comprehensive tool designed to evaluate the risk associated with a given cryptocurrency address. It provides a detailed analysis of the address's transaction history, entity information, and jurisdictional risk factors.

### Transaction Risk Factors

1. **High-value transfers**: Multiple transfers exceeding $100,000
2. **Transaction frequency**: Above average transaction frequency
3. **Age of wallet**: Wallet active for more than 1 year

### Entity Risk Factors

1. **Known entity**: Entity identified as legitimate business
2. **Entity type**: Registered as cryptocurrency exchange
3. **KYC requirements**: Requires KYC verification

### Jurisdiction Risk Factors

1. **Geographic location**: Operations in high-risk jurisdiction
2. **Regulatory compliance**: Partial compliance with regulations


#### Address vs transaction risk
Currently, the user can input an address. Create a new feature that would support a transaction id.

Many of the same UI elements will overlap, the distinction however is that, if an address is input, the system will show a summary of the risk factors associated with the address. If a transaction id is input, the system will show a detailed analysis of the transaction and the risk factors associated with it.