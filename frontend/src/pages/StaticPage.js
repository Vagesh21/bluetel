import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export default function StaticPage() {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  const slug = paramSlug || location.pathname.replace(/^\//, '');
  const [page, setPage] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get(`/pages/${slug}`).then(r => setPage(r.data)).catch(() => setError(true));
  }, [slug]);

  if (error) return <div className="pt-32 pb-20 text-center text-gray-500 min-h-screen">Page not found.</div>;
  if (!page) return <div className="pt-32 pb-20 text-center text-gray-500 min-h-screen">Loading...</div>;

  return (
    <div className="pt-16 min-h-screen" data-testid={`static-page-${slug}`}>
      <section className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-heading text-3xl md:text-4xl text-white mb-8">{page.title}</h1>
            <div className="prose prose-invert max-w-none text-gray-400 leading-relaxed
              prose-headings:text-white prose-headings:font-heading
              prose-p:text-gray-400 prose-a:text-amber prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white"
              dangerouslySetInnerHTML={{ __html: page.content_html }}
            />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
