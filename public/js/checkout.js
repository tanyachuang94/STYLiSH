TPDirect.setupSDK(12348, 'app_pa1pQcKoY22IlnSXq5m5WP5jFKzoRG58VEXpT7wU62ud7mMbDOGzCYIlzzLF', 'sandbox') // Tappay設置好 GetPrime 所需要的金鑰
TPDirect.card.setup({
    fields: {
        number: {
            element: '.form-control.card-number',
            placeholder: '**** **** **** ****'
        },
        expirationDate: {
            element: document.getElementById('tappay-expiration-date'),
            placeholder: 'MM / YY'
        },
        ccv: {
            element: $('.form-control.cvc')[0],
            placeholder: '後三碼'
        }
    },
    styles: {
        'input': {
            'color': 'gray'
        },
        'input.ccv': {
            // 'font-size': '16px'
        },
        ':focus': {
            'color': 'black'
        },
        '.valid': {
            'color': 'green'
        },
        '.invalid': {
            'color': 'red'
        },
        '@media screen and (max-width: 400px)': {
            'input': {
                'color': 'orange'
            }
        }
    }
})
// listen for TapPay Field
TPDirect.card.onUpdate(function (update) {
    /* Disable / enable submit button depend on update.canGetPrime  */
    /* ============================================================ */

    // update.canGetPrime === true
    //     --> you can call TPDirect.card.getPrime()
    // const submitButton = document.querySelector('button[type="submit"]')
    if (update.canGetPrime) {
        // submitButton.removeAttribute('disabled')
        $('button[type="submit"]').removeAttr('disabled')
    } else {
        // submitButton.setAttribute('disabled', true)
        $('button[type="submit"]').attr('disabled', true)
    }


    /* Change card type display when card type change */
    /* ============================================== */

    // cardTypes = ['visa', 'mastercard', ...]
    var newType = update.cardType === 'unknown' ? '' : update.cardType
    $('#cardtype').text(newType)



    /* Change form-group style when tappay field status change */
    /* ======================================================= */

    // number 欄位是錯誤的
    if (update.status.number === 2) {
        setNumberFormGroupToError('.card-number-group')
    } else if (update.status.number === 0) {
        setNumberFormGroupToSuccess('.card-number-group')
    } else {
        setNumberFormGroupToNormal('.card-number-group')
    }

    if (update.status.expiry === 2) {
        setNumberFormGroupToError('.expiration-date-group')
    } else if (update.status.expiry === 0) {
        setNumberFormGroupToSuccess('.expiration-date-group')
    } else {
        setNumberFormGroupToNormal('.expiration-date-group')
    }

    if (update.status.cvc === 2) {
        setNumberFormGroupToError('.cvc-group')
    } else if (update.status.cvc === 0) {
        setNumberFormGroupToSuccess('.cvc-group')
    } else {
        setNumberFormGroupToNormal('.cvc-group')
    }
})

$('form').on('submit', function (event) {
    event.preventDefault()
    let orderList =  order(); 
    const tappayStatus = TPDirect.card.getTappayFieldsStatus()
    console.log(tappayStatus)
    // Check TPDirect.card.getTappayFieldsStatus().canGetPrime before TPDirect.card.getPrime
    if (tappayStatus.canGetPrime === false) {
      alert('can not get prime')
      return
    }
    // Get prime
    TPDirect.card.getPrime(function (result) {
      if (result.status !== 0) {
          alert('get prime error ' + result.msg)
          return
      }
      let prime = result.card.prime
      orderList.prime = prime
      console.log(orderList)
      fetch('/api/1.0/order/checkout', {
        method: 'POST', 
        body: JSON.stringify(orderList), 
        headers:{'Content-Type': 'application/json'}
      })
      .then(
        window.location.href = './thankyou.html'
      )      
    })
})

function setNumberFormGroupToError(selector) {
    $(selector).addClass('has-error')
    $(selector).removeClass('has-success')
}

function setNumberFormGroupToSuccess(selector) {
    $(selector).removeClass('has-error')
    $(selector).addClass('has-success')
}

function setNumberFormGroupToNormal(selector) {
    $(selector).removeClass('has-error')
    $(selector).removeClass('has-success')
}
