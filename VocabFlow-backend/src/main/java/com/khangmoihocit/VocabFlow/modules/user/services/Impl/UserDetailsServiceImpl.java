package com.khangmoihocit.VocabFlow.modules.user.services.Impl;

import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    @Autowired
    UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> userOptional = userRepository.findByEmail(username);
        if(userOptional.isPresent()){
            UserDetailsCustom userDetailsCustom = UserDetailsCustom.builder() //user sẽ gán vào spring security
                    .id(userOptional.get().getId())
                    .email(userOptional.get().getEmail())
                    .password(userOptional.get().getPasswordHash())
                    .isActive(userOptional.get().getIsActive())
                    .authorities(Collections.singleton(new SimpleGrantedAuthority("ROLE_" + userOptional.get().getRole())))
                    .build();
            return userDetailsCustom;
        }else{
            throw new UsernameNotFoundException("User not found with email: " + username);
        }
    }
}
