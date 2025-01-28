/* eslint-disable react-hooks/exhaustive-deps */
// This example shows you how to set up React Stripe.js and use Elements.
// Learn how to accept a payment using the official Stripe docs.
// https://stripe.com/docs/payments/accept-a-payment#web



import {CardElement,useElements, useStripe} from '@stripe/react-stripe-js';

import './CheckoutForm.css';
import PropTypes from 'prop-types';
import { useEffect, useState, } from 'react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import useAuth from '../../hooks/useAuth';



const CheckoutForm = ({closeModal,bookingInfo}) => {
  const stripe = useStripe();
  const elements = useElements();
  const axiosSecure=useAxiosSecure()
  const {user}=useAuth()


  const [clientSecret, setClientSecret] = useState();
  const [cardError,setCardError]=useState('')
  const[processing,setProcessing]=useState(false);


  useEffect(()=>{
    if(bookingInfo?.price && bookingInfo?.price>1){
        getClientSecret({price:bookingInfo?.price})
      
    }



 },[bookingInfo?.price])

  

  const getClientSecret= async price=>{
    const {data}=await axiosSecure.post('/create-payment-intent', price)
    console.log(data);
    setClientSecret(data.clientSecret)
  }

  const handleSubmit = async (event) => {
    // Block native form submission.
    event.preventDefault();
    setProcessing(true)

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const card = elements.getElement(CardElement);

    if (card == null) {
      return;
    }

    // Use your card Element with other Stripe.js APIs
    const {error, paymentMethod} = await stripe.createPaymentMethod({
      type: 'card',
      card,
    });

    if (error) {
      console.log('[error]', error);
      setCardError(error?.message)
      return
    } else {
      console.log('[PaymentMethod]', paymentMethod);
      setCardError('')
    }
    // Confirm the PaymentIntent with the payment method
    const {error:paymentError,paymentIntent}=await stripe.confirmCardPayment(clientSecret,{
        payment_method:{
            card:card,
            billing_details:{
                email: user?.email,
                name: user?.displayName    
            }
        }
    })
    if(paymentError){
        console.log('[error]', paymentError);
        setCardError(paymentError?.message)
        setProcessing(false)
        return
    }
    if(paymentIntent==='succeeded'){
        console.log('[PaymentIntent]', paymentIntent);
        setCardError('')
        setProcessing(false)
        closeModal()
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit}>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }}
      />
     
      <div className='flex mt-2 justify-around'>
                <button
                type="submit" disabled={!stripe || processing || !clientSecret} 
                      
                      className='inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2'
                      onClick={closeModal}
                    >
                      Pay Now $ {bookingInfo?.price}
                    </button>
                    <button
                    
                      type='button'
                      className='inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2'
                    >
                        Cancel
                    </button>
                    
                  </div>

    </form>
    {cardError && <p className='text-red-500'>{cardError}</p>}
    </>
  );
};

CheckoutForm.propTypes = {
    closeModal: PropTypes.func.isRequired,
    bookingInfo: PropTypes.object.isRequired
};


export default CheckoutForm;


