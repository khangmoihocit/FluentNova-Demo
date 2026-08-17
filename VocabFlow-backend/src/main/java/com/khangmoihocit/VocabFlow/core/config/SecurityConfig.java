package com.khangmoihocit.VocabFlow.core.config;

import com.khangmoihocit.VocabFlow.core.security.JwtAccessDeniedHandler;
import com.khangmoihocit.VocabFlow.core.security.JwtAuthenticationEntryPoint;
import com.khangmoihocit.VocabFlow.core.security.JwtAuthenticationFilter;
import com.khangmoihocit.VocabFlow.modules.user.services.Impl.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class SecurityConfig {

    UserDetailsServiceImpl userDetailsService;
    JwtAuthenticationFilter jwtAuthFilter;
    JwtAccessDeniedHandler jwtAccessDeniedHandler;
    JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
//    OAuth2SuccessHandler oAuth2SuccessHandler;

    String[] PUBLIC_POST_ENDPOINTS = {
            "/api/v1/auth/**",
            "/oauth2/**",
            "/api/v1/fill-blanks/video/*/submit",
            "/api/v1/quizzes/video/*/submit",
    };

    String [] PUBLIC_GET_ENDPOINTS = {
            "/api/v1/topics/find-all",
            "/api/v1/auth/**",
            "/oauth2/**",
//            "/v3/api-docs/**",
//            "/swagger-ui/**",
//            "/swagger-ui.html",
            "/api/v1/youtube-channels/find-all",
            "/api/v1/video-lessons/find-all",
            "/api/v1/categories",
            "/api/v1/categories/get-category-video",
            "/api/v1/vocabularies/lookup",  
            "/api/v1/video-segments/*/study-detail",
            "/api/v1/fill-blanks/video/*",
            "/api/v1/quizzes/video/*",
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(request ->
                        request.requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
                                .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINTS).permitAll()
                                .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
//                .oauth2Login(oauth2 -> oauth2
//                        .successHandler(oAuth2SuccessHandler))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(jwtAccessDeniedHandler))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return httpSecurity.build();
    }

    //custom method xác thực user
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
//        authProvider.setPreAuthenticationChecks(user -> {}); // lambda rỗng, không check gì
        return authProvider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOriginPatterns(List.of(
                "https://fluentnova.site",
//                "http://localhost:5173",
//                "http://localhost:5174",
                "chrome-extension://foioemhfhdejepfeikpgibjlglbghnpf"
        ));
        configuration.setAllowCredentials(true);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
}
