FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql \
    && a2enmod rewrite headers expires

# Document root aponta para /public (igual ao public_html da Hostinger)
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && sed -ri -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

RUN { \
      echo 'upload_max_filesize=10M'; \
      echo 'post_max_size=12M'; \
      echo 'display_errors=On'; \
    } > /usr/local/etc/php/conf.d/imperioacai.ini

WORKDIR /var/www/html
