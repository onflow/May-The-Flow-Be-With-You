'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { generateMessage, generateImage } from '@/utils/ai';
import { createGiftCard } from '@/utils/flow';

import {
  useCurrentFlowUser,
  useFlowTransactionStatus
} from "@onflow/kit";


export default function CreateGiftCard() {
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [value, setValue] = useState('');
  const [context, setContext] = useState('');
  const [imageContext, setImageContext] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [txId, setTxId] = useState('');

  const { user } = useCurrentFlowUser();

  const handleGenerateContent = async () => {
    if (!context) {
      toast.error('Please provide a context for the gift card');
      return;
    }

    setMessageLoading(true);
    try {
      const [generatedMessage] = await Promise.all([
        generateMessage(context),
      ]);

      setMessage(generatedMessage || '');
      
      toast.success('Message generated successfully!');
    } catch (error) {
      console.error('Error generating message:', error);
      toast.error('Failed to generate message');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imageContext) {
      toast.error('Please provide a context for the image of gift card');
      return;
    }

    setImageLoading(true);
    try {
      const [generatedImage] = await Promise.all([
        generateImage(imageContext),
      ]);

      setImageUrl(generatedImage || '');
      
      toast.success('Image generated successfully!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setImageLoading(false);
    }
  };

  const handleCreateGiftCard = async () => {
    if (!recipientAddress || !value || !message || !imageUrl) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Upload image to IPFS
      //const ipfsUrl = await uploadImageFromUrl(imageUrl);
      
      // Create gift card on Flow blockchain
      const transactionId = await createGiftCard(
        recipientAddress,
        parseFloat(value),
        message,
        //ipfsUrl
        imageUrl
      );

      toast.success(`Gift card creation processing! Transaction ID: ${transactionId}`);
      setTxId(transactionId);
      
      // Reset form
      setRecipientAddress('');
      setValue('');
      setContext('');
      setMessage('');
      setImageUrl('');
      setImageContext('');
    } catch (error) {
      console.error('Error creating gift card:', error);
      toast.error('Failed to create gift card');
    } finally {
      setLoading(false);
    }
  };

  const { transactionStatus, error: txStatusError } = useFlowTransactionStatus(
    { id: txId || "" },
  );

  useEffect(() => {
    if (txId && transactionStatus?.status === 4 && !txStatusError) {
      toast.success(`Transaction ${txId} is successful`);
    } else if (txStatusError) {
      toast.error(`Transaction ${txId} has failed : ${txStatusError.message}`);
    }
  }, [transactionStatus?.status, txId, txStatusError]);


  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Create a Gift Card
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="0x..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Value (in FLOW)
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="0.0"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Context for AI Message Generation
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                placeholder="E.g., Birthday gift for my sister who loves painting"
              />
            </div>

            <button
              onClick={handleGenerateContent}
              disabled={messageLoading || !context}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {messageLoading ? 'Generating...' : 'Generate Message'}
            </button>

            {message && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Generated Message
                </label>
                <p className="mt-1 text-gray-600">{message}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Context for AI Image Generation <span className="text-xs text-red-500">(currently generated image is hardcoded due to the no access to the paid API of Imagen)</span>
              </label>
              <textarea
                value={imageContext}
                onChange={(e) => setImageContext(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
                placeholder="E.g., A friend who loves to travel to mountains"
              />
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={imageLoading || !imageContext}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {imageLoading ? 'Generating...' : 'Generate Image'}
            </button>

            {imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Generated Image
                </label>
                <img
                  src={imageUrl}
                  alt="Gift Card"
                  className="mt-1 rounded-md w-full h-200 object-cover"
                />
              </div>
            )}

            <button
              onClick={handleCreateGiftCard}
              disabled={loading || !recipientAddress || !value || !message || !imageUrl || (!user || !user?.loggedIn)}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Gift Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 